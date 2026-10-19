import type { Request, Response } from 'express'
import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { getCloudinary } from '../config/cloudinary.js'
import { User } from '../models/User.js'
import { ownedPublicId } from '../services/avatarOwnership.js'

export async function uploadAvatar(req: Request, res: Response) {
  const userId: string = res.locals.userId
  try {
    const user = await User.findOne({ _id: userId, isActive: true }).select('avatarUrl').lean()
    if (!user) {
      res.status(401).json({ message: 'Session account is unavailable.' })
      return
    }

    let portrait: Buffer
    try {
      if (!req.file?.buffer.length) throw new Error('Missing image')
      const image = sharp(req.file.buffer, { failOn: 'warning', limitInputPixels: 40_000_000 })
      const metadata = await image.metadata()
      if (!metadata.format || !['jpeg', 'png', 'webp'].includes(metadata.format) || (metadata.pages ?? 1) > 1) throw new Error('Unsupported image')
      // Decode and re-encode pixels; Sharp strips metadata by default.
      portrait = await image.rotate().resize(400, 400, { fit: 'cover', position: 'attention' })
        .flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer()
    } catch {
      res.status(400).json({ message: 'Upload a valid, non-animated JPG, PNG or WebP image (up to 40 megapixels).' })
      return
    }

    const cloudinary = getCloudinary()
    const publicId = `docvia/avatars/${userId}/${randomUUID()}`
    const cleanup = async (id: string) => {
      try {
        await cloudinary.uploader.destroy(id, { resource_type: 'image', invalidate: true })
      } catch {
        console.error('Avatar cleanup failed; retained asset:', id)
      }
    }

    let avatarUrl: string
    try {
      avatarUrl = await new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({
          public_id: publicId, resource_type: 'image', format: 'jpg', overwrite: false, timeout: 60_000,
        }, (error, result) => {
          if (error || !result?.secure_url?.startsWith('https://')) reject(new Error('Image upload failed'))
          else resolve(result.secure_url)
        })
        stream.on('error', reject)
        stream.end(portrait)
      })
    } catch {
      await cleanup(publicId)
      res.status(502).json({ message: 'Unable to upload your avatar. Please try again.' })
      return
    }

    // Compare-and-set prevents concurrent replacements from deleting a winning upload.
    let updated
    try {
      updated = await User.findOneAndUpdate(
        { _id: userId, isActive: true, avatarUrl: user.avatarUrl ?? null },
        { $set: { avatarUrl } },
        { new: true, runValidators: true }
      ).select('avatarUrl').lean()
    } catch {
      // A network error can occur after MongoDB commits. Do not delete an image
      // that might now be referenced; retain it for reconciliation if uncertain.
      console.error('Avatar database update uncertain; retained asset:', publicId)
      res.status(500).json({ message: 'Unable to confirm the avatar update. Refresh your profile before retrying.' })
      return
    }
    if (!updated) {
      await cleanup(publicId)
      res.status(409).json({ message: 'Your profile changed during upload. Refresh and try again.' })
      return
    }

    const previousId = ownedPublicId(user.avatarUrl, cloudinary.config().cloud_name ?? '', userId)
    if (previousId) await cleanup(previousId)
    res.status(200).json({ avatarUrl: updated.avatarUrl })
  } catch {
    res.status(500).json({ message: 'Avatar upload is unavailable. Please try again later.' })
  }
}
