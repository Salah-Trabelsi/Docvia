import { replace, type LoaderFunctionArgs } from 'react-router'

// Single-use, tab-memory-only handoff. Never put the token in router data,
// React state, query keys, mutation variables, or browser storage.
let pendingToken: string | undefined
let expiresAt = 0
let expiryTimer: ReturnType<typeof setTimeout> | undefined

function clearToken() {
  pendingToken = undefined
  expiresAt = 0
  clearTimeout(expiryTimer)
}

export function hasResetToken() {
  if (expiresAt <= Date.now()) clearToken()
  return !!pendingToken
}

export function consumeResetToken() {
  const token = hasResetToken() ? pendingToken : undefined
  clearToken()
  return token
}

export function resetPasswordLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  if (!url.searchParams.has('token')) return null
  clearToken()
  const token = url.searchParams.get('token') ?? ''
  if (/^[a-f\d]{64}$/.test(token)) {
    pendingToken = token
    expiresAt = Date.now() + 30 * 60_000
    expiryTimer = setTimeout(clearToken, 30 * 60_000)
  }
  // Replaces the original history entry before the form can render.
  return replace('/reset-password')
}
