import { z } from 'zod'

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.'),
  newPassword: z.string().min(12, 'Use at least 12 characters.').max(128, 'Use no more than 128 characters.'),
  confirmPassword: z.string().min(1, 'Confirm your new password.'),
}).refine(data => data.newPassword === data.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' })
  .refine(data => data.currentPassword !== data.newPassword, { path: ['newPassword'], message: 'Choose a different password.' })

export const emailSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  confirmEmail: z.string().trim().email('Enter a valid email address.'),
}).refine(data => data.email === data.confirmEmail, { path: ['confirmEmail'], message: 'Email addresses do not match.' })

