import { randomBytes, createHash } from 'node:crypto'
import { Resend } from 'resend'
import { User } from '../models/User.js'
import { validateEnv } from '../config/env.js'
import { passwordResetEmail } from '../emails/passwordResetEmail.js'

export function hashResetToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function sendPasswordReset(email: string) {
  const env = validateEnv()
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_SECURITY) throw new Error('Email unavailable')
  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const user = await User.findOneAndUpdate({
    email, isActive: true,
    $or: [
      { passwordResetRequestedAt: { $exists: false } },
      { passwordResetRequestedAt: { $lte: new Date(now.getTime() - 60_000) } },
    ],
  }, { $set: {
    passwordResetTokenHash: hashResetToken(token),
    passwordResetExpiresAt: new Date(now.getTime() + 30 * 60_000),
    passwordResetRequestedAt: now,
  } }, { new: true, runValidators: true }).select('email firstName')
  if (!user) return
  const link = new URL(`${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password`)
  link.searchParams.set('token', token)
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM_SECURITY, to: user.email,
    ...passwordResetEmail(user.firstName, link.toString()),
  })
  if (error) throw new Error('Reset email delivery failed')
}
