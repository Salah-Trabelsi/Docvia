import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { User } from '../models/User.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ownedPublicId } from '../services/avatarOwnership.js'

const deletionSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
}).strict()

export async function deleteAccount(req: Request, res: Response) {
  const parsed = deletionSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Provide a valid email and password.' })
    return
  }
  try {
    const user = await User.findOne({ _id: res.locals.userId, isActive: true }).select('+passwordHash')
    if (!user) { res.status(401).json({ message: 'Session account is unavailable.' }); return }
    const passwordMatches = await bcrypt.compare(parsed.data.password, user.passwordHash)
    if (parsed.data.email !== user.email || !passwordMatches) {
      res.status(400).json({ message: 'Unable to delete account. Check your credentials.' })
      return
    }

    // No appointment/review models or write endpoints exist yet. Restrict rather
    // than cascade: support conventional reference names and ObjectId/string IDs.
    // Any future patient-data writers must coordinate with account deletion.
    const ids = [user._id, user._id.toString()]
    const references = { $or: ['patient', 'patientId', 'user', 'userId', 'author', 'authorId', 'patient._id', 'user._id', 'author._id']
      .map(field => ({ [field]: { $in: ids } })) }
    const db = User.db.db
    if (!db) throw new Error('Database unavailable')
    const [appointment, review] = await Promise.all([
      db.collection('appointments').findOne(references, { projection: { _id: 1 } }),
      db.collection('reviews').findOne(references, { projection: { _id: 1 } }),
    ])
    if (appointment || review) {
      res.status(409).json({ message: 'Account deletion requires review of linked appointments or reviews. Please contact support.' })
      return
    }

    // Validate cleanup configuration before committing an irreversible deletion.
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? ''
    const avatarId = ownedPublicId(user.avatarUrl, cloudName, user._id.toString())
    const cloudinary = avatarId ? getCloudinary() : undefined
    const deleted = await User.findOneAndDelete({
      _id: user._id, email: user.email, passwordHash: user.passwordHash,
      isActive: true, avatarUrl: user.avatarUrl ?? null,
    }).select('_id')
    if (!deleted) {
      res.status(409).json({ message: 'Your account changed. Refresh and try again.' })
      return
    }

    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
    if (avatarId && cloudinary) {
      // External cleanup cannot roll back a deleted MongoDB user. Retry and log
      // only the owned asset ID for manual cleanup if the provider stays down.
      let cleaned = false
      for (let attempt = 0; attempt < 3 && !cleaned; attempt++) {
        try {
          const result = await cloudinary.uploader.destroy(avatarId, { resource_type: 'image', invalidate: true })
          cleaned = result.result === 'ok' || result.result === 'not found'
        } catch { /* Retry without logging provider credentials or response data. */ }
      }
      if (!cleaned) console.error('Deleted-account avatar requires cleanup:', avatarId)
    }
    res.status(200).json({ message: 'Account deleted successfully.' })
  } catch {
    res.status(500).json({ message: 'Unable to complete account deletion. Please try again later.' })
  }
}
