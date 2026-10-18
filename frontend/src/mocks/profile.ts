import type { ProfileFormValues } from '@/features/profile/schemas/profileSchema'
import type { EmergencyContactValues } from '@/features/profile/schemas/emergencyContactSchema'
import type { ProfileAccount } from '@/features/profile/types/account.types'

// Fictional demo identity, unrelated to the reference screenshot or signed-in user.
export const mockProfile: ProfileFormValues = {
  firstName: 'Alex',
  lastName: 'Example',
  email: 'alex.example@example.com',
  phone: '',
  dateOfBirth: '',
  gender: 'Prefer not to say',
  streetAddress: '',
  city: '',
  postalCode: '',
  country: 'Germany',
}

export const mockAccount: ProfileAccount = {
  accountType: 'Patient',
  memberSince: '2025-10-12',
  emailVerified: true,
  status: 'Active',
}

export const mockEmergencyContact: EmergencyContactValues = {
  contactName: '',
  relationship: '',
  phone: '',
}

