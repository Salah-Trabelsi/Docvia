import type { Request, Response } from 'express'
import { Error as MongooseError } from 'mongoose'
import { z } from 'zod'
import { User } from '../models/User.js'

const profileFields =
  '_id firstName lastName email phone dateOfBirth gender streetAddress city postalCode country avatarUrl role isEmailVerified isActive createdAt emergencyContact'

const emergencyContactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  relationship: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).refine(value =>
    /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7
    && value.replace(/\D/g, '').length <= 15, 'Enter a phone number with 7–15 digits.'),
}).strict()

const dateOfBirthSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD.')
  .refine(value => {
    const date = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
      && date.getTime() <= Date.now()
  }, 'Enter a valid date of birth that is not in the future.')
  .transform(value => new Date(`${value}T00:00:00.000Z`))

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).refine(value => value === '' || (
    /^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7
    && value.replace(/\D/g, '').length <= 15
  ), 'Enter a phone number with 7–15 digits.').optional(),
  dateOfBirth: dateOfBirthSchema.nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Prefer not to say']).optional(),
  streetAddress: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(16).optional(),
  country: z.string().trim().max(80).optional(),
  emergencyContact: emergencyContactSchema.nullable().optional(),
}).strict().refine(value => Object.keys(value).length > 0, 'Provide at least one profile field.')

export async function getProfile(_req: Request, res: Response) {
  try {
    const user = await User.findOne({ _id: res.locals.userId, isActive: true })
      .select(profileFields).lean()
    if (!user) {
      res.status(401).json({ message: 'Session account is unavailable.' })
      return
    }
    res.json(user)
  } catch {
    res.status(500).json({ message: 'Unable to retrieve profile. Please try again later.' })
  }
}

export async function updateProfile(req: Request, res: Response) {
  const parsed = updateProfileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid profile details.', errors: parsed.error.flatten() })
    return
  }

  try {
    const user = await User.findOneAndUpdate(
      { _id: res.locals.userId, isActive: true },
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).select(profileFields).lean()
    if (!user) {
      res.status(401).json({ message: 'Session account is unavailable.' })
      return
    }
    res.json(user)
  } catch (error: unknown) {
    if (error instanceof MongooseError.ValidationError || error instanceof MongooseError.CastError) {
      res.status(400).json({ message: 'Invalid profile details.' })
      return
    }
    res.status(500).json({ message: 'Unable to update profile. Please try again later.' })
  }
}
