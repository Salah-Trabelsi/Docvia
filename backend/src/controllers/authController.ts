import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { User } from '../models/User.js'
import { validateEnv } from '../config/env.js'
import { hashVerificationToken, sendVerificationEmail } from '../services/emailVerification.js'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes.',
  }),
})

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid login details.', errors: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const user = await User.findOne({ email: parsed.data.email }).select('+passwordHash +sessionVersion')
    if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash) || !user.isActive) {
      res.status(401).json({ message: 'Invalid credentials or account unavailable.' })
      return
    }

    const { JWT_SECRET } = validateEnv()
    const token = jwt.sign({ sessionVersion: user.sessionVersion ?? 0 }, JWT_SECRET, {
      algorithm: 'HS256',
      subject: user._id.toString(),
      expiresIn: '7d',
    })

    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    res.set('Cache-Control', 'no-store')
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    })
  } catch {
    res.status(500).json({ message: 'Unable to sign in. Please try again later.' })
  }
}

const registrationSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).refine(value => Buffer.byteLength(value, 'utf8') <= 72, {
    message: 'Password must be at most 72 bytes.',
  }),
})

export async function register(req: Request, res: Response) {
  const parsed = registrationSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      message: 'Invalid registration details.',
      errors: parsed.error.flatten().fieldErrors,
    })
    return
  }

  const { firstName, lastName, email, password } = parsed.data

  try {
    if (await User.exists({ email })) {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      role: 'patient',
      isEmailVerified: false,
      isActive: true,
    })

    try {
      await sendVerificationEmail(user.email)
    } catch {
      console.error('Registration verification email could not be sent; resend remains available.')
    }

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    })
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
      res.status(409).json({ message: 'An account with this email already exists.' })
      return
    }
    res.status(500).json({ message: 'Unable to create account. Please try again later.' })
  }
}

export async function verifyEmail(req: Request, res: Response) {
  const parsed = z.object({ token: z.string().regex(/^[a-f\d]{64}$/) }).strict().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid, expired or already used verification link.' })
    return
  }
  try {
    const user = await User.findOneAndUpdate({
      emailVerificationTokenHash: hashVerificationToken(parsed.data.token),
      emailVerificationExpiresAt: { $gt: new Date() },
      isEmailVerified: false,
      isActive: true,
    }, {
      $set: { isEmailVerified: true },
      $unset: { emailVerificationTokenHash: 1, emailVerificationExpiresAt: 1, emailVerificationRequestedAt: 1 },
    }, { new: true, runValidators: true }).select('_id')
    if (!user) {
      res.status(400).json({ message: 'Invalid, expired or already used verification link.' })
      return
    }
    res.json({ message: 'Your email has been verified successfully.' })
  } catch {
    res.status(500).json({ message: 'Unable to verify your email. Please try again later.' })
  }
}

export async function resendVerification(req: Request, res: Response) {
  const parsed = z.object({ email: z.string().trim().toLowerCase().email().max(254) }).strict().safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Enter a valid email address.' })
    return
  }
  try {
    await sendVerificationEmail(parsed.data.email)
  } catch {
    console.error('Verification email request could not be completed.')
  }
  res.json({ message: 'If an eligible account exists, a verification email will be sent. Please wait at least one minute before requesting another.' })
}
