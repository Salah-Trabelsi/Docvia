import { z } from 'zod'
import { format, isValid, parseISO } from 'date-fns'

export const genderOptions = ['Male', 'Female', 'Prefer not to say'] as const
export const countryOptions = ['Germany', 'Austria', 'Switzerland', 'France', 'Belgium', 'Netherlands', 'Italy', 'Spain', 'United Kingdom', 'United States', 'Canada', 'Other'] as const

export const profileSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required.').max(80, 'Use 80 characters or fewer.'),
  lastName: z.string().trim().min(1, 'Last name is required.').max(80, 'Use 80 characters or fewer.'),
  email: z.string().email('Enter a valid email address.'),
  phone: z.string().trim().refine(value => value === '' || (/^\+?[\d\s().-]+$/.test(value) && value.replace(/\D/g, '').length >= 7 && value.replace(/\D/g, '').length <= 15), 'Enter a phone number with 7–15 digits.'),
  dateOfBirth: z.string().refine(value => {
    if (!value) return true
    const parsed = parseISO(value)
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && isValid(parsed) && format(parsed, 'yyyy-MM-dd') === value
  }, 'Choose a valid date.').refine(value => {
    if (!value) return true
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
    return value <= today
  }, 'Date of birth cannot be in the future.'),
  gender: z.union([z.literal(''), z.enum(genderOptions)]),
  streetAddress: z.string().trim().max(160, 'Use 160 characters or fewer.'),
  city: z.string().trim().max(80, 'Use 80 characters or fewer.'),
  postalCode: z.string().trim().max(16, 'Use 16 characters or fewer.'),
  country: z.string().trim().max(80, 'Use 80 characters or fewer.'),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

