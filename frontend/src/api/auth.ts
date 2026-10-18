import axios from 'axios'
import { api } from '@/lib/axios'

export interface AuthUser {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: 'patient' | 'admin'
}

export interface LoginInput { email: string; password: string }
export interface RegisterInput extends LoginInput { firstName: string; lastName: string }

export async function registerUser(input: RegisterInput) {
  const { data } = await api.post<AuthUser>('/auth/register', input, { withCredentials: true })
  return data
}

export async function loginUser(input: LoginInput) {
  const { data } = await api.post<AuthUser>('/auth/login', input, { withCredentials: true })
  return data
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<AuthUser>('/auth/me', { withCredentials: true, signal })
    return data
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null
    throw error
  }
}

export async function logoutUser() {
  await api.post('/auth/logout', undefined, { withCredentials: true })
}

export function authErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'Unable to reach Docvia. Please try again.'
    if (error.response.status >= 500) return 'Docvia is temporarily unavailable. Please try again.'
    return error.response.data?.message || 'Unable to complete your request. Please try again.'
  }
  return 'Unable to confirm your session. Please try signing in again.'
}
