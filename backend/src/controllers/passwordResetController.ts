import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { User } from '../models/User.js'
import { hashResetToken, sendPasswordReset } from '../services/passwordReset.js'

const emailSchema = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict()
const resetSchema = z.object({
  token: z.string().regex(/^[a-f\d]{64}$/),
  password: z.string().min(8).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must not exceed 72 bytes.'),
}).strict()

export function forgotPassword(req: Request, res: Response) {
  const parsed = emailSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Enter a valid email address.' })
    return
  }
  // Respond before account lookup/delivery so their latency cannot disclose
  // whether an account exists. The persistent cooldown is claimed atomically.
  res.status(200).json({ message: 'If an eligible account exists, a password-reset email will be sent. Please check your inbox.' })
  void sendPasswordReset(parsed.data.email).catch(() => {
    console.error('Password-reset email request could not be completed.')
  })
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Provide a valid reset token and a password of at least 8 characters (maximum 72 bytes).' })
    return
  }
  try {
    const tokenHash = hashResetToken(parsed.data.token)
    const filter = { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() }, isActive: true }
    if (!await User.exists(filter)) {
      res.status(400).json({ message: 'Invalid, expired or already used reset link.' })
      return
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const user = await User.findOneAndUpdate({ ...filter, passwordResetExpiresAt: { $gt: new Date() } }, {
      $set: { passwordHash },
      $inc: { sessionVersion: 1 },
      $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
    }, { new: true, runValidators: true }).select('_id')
    if (!user) {
      res.status(400).json({ message: 'Invalid, expired or already used reset link.' })
      return
    }
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
    res.status(200).json({ message: 'Password reset successfully. Please sign in with your new password.' })
  } catch {
    res.status(500).json({ message: 'Unable to reset password. Please try again later.' })
  }
}
