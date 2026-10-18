import { api } from '@/lib/axios'
import type { AuthUser } from './auth'

export interface UserProfile extends Omit<AuthUser, '_id'> {
  phone?: string
  dateOfBirth?: string | null
  gender?: 'Male' | 'Female' | 'Prefer not to say'
  streetAddress?: string
  city?: string
  postalCode?: string
  country?: string
  avatarUrl?: string
  emergencyContact?: { name?: string; relationship?: string; phone?: string } | null
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
}

export type ProfileUpdate = Partial<Pick<UserProfile, 'firstName' | 'lastName' | 'phone' | 'dateOfBirth' | 'gender' | 'streetAddress' | 'city' | 'postalCode' | 'country' | 'emergencyContact'>>

export async function getProfile(signal?: AbortSignal) {
  const { data } = await api.get<UserProfile>('/users/me', { withCredentials: true, signal })
  return data
}

export async function updateProfile(input: ProfileUpdate) {
  const { data } = await api.patch<UserProfile>('/users/me', input, { withCredentials: true })
  return data
}

export async function uploadAvatar(file: File, onProgress: (percent: number) => void) {
  const body = new FormData()
  body.append('avatar', file)
  const { data } = await api.post<{ avatarUrl: string }>('/users/me/avatar', body, {
    withCredentials: true,
    timeout: 120_000,
    onUploadProgress: event => {
      if (event.total) onProgress(Math.round(event.loaded / event.total * 100))
    },
  })
  return data
}
