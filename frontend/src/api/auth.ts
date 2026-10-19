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

export class DeleteAccountError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'DeleteAccountError'
    this.status = status
  }
}

export async function deleteAccount(input: { email: string; password: string }) {
  try {
    const { data } = await api.delete<{ message: string }>('/users/me', {
      data: input, withCredentials: true, timeout: 60_000,
    })
    return data
  } catch (error) {
    // Never retain password-bearing Axios configuration in the mutation cache.
    throw new DeleteAccountError(authErrorMessage(error), axios.isAxiosError(error) ? error.response?.status : undefined)
  }
}

export async function requestEmailChange(input: { newEmail: string; currentPassword: string }) {
  try {
    await api.post('/users/me/request-email-change', input, { withCredentials: true })
  } catch (error) {
    // eslint-disable-next-line preserve-caught-error -- The Axios cause contains passwords and must not enter the mutation cache.
    throw new Error(authErrorMessage(error))
  }
}

export async function confirmEmailChange(token: string) {
  await api.post('/auth/confirm-email-change', { token }, { withCredentials: true })
}

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  try {
    const { data } = await api.post<{ message: string }>('/users/me/change-password', input, { withCredentials: true })
    return data
  } catch (error) {
    // Keep password-bearing Axios request configuration out of the mutation cache.
    // eslint-disable-next-line preserve-caught-error -- The Axios cause contains passwords and must not enter the mutation cache.
    throw new Error(authErrorMessage(error))
  }
}

export async function verifyEmail(token: string) {
  await api.post('/auth/verify-email', { token }, { withCredentials: true })
}

export async function resendVerification(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/resend-verification', { email }, { withCredentials: true })
  return data
}

export async function forgotPassword(email: string) {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email }, { withCredentials: true })
  return data
}

export type ResetPasswordResult = 'success' | 'invalid' | 'network-error' | 'rate-limited' | 'server-error'

export async function resetPassword(token: string, password: string): Promise<ResetPasswordResult> {
  try {
    await api.post('/auth/reset-password', { token, password }, { withCredentials: true })
    return 'success'
  } catch (error) {
    // Do not pass Axios errors to the mutation cache: their request config can
    // contain the password and raw reset token.
    if (axios.isAxiosError(error)) {
      if (!error.response) return 'network-error'
      if (error.response.status === 400) return 'invalid'
      if (error.response.status === 429) return 'rate-limited'
    }
    return 'server-error'
  }
}

export function authErrorMessage(error: unknown) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    if (!error.response) return 'Unable to reach Docvia. Please try again.'
    if (error.response.status >= 500) return 'Docvia is temporarily unavailable. Please try again.'
    return error.response.data?.message || 'Unable to complete your request. Please try again.'
  }
  return 'Unable to confirm your session. Please try signing in again.'
}
