import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { AuthLayout } from '../components/AuthLayout'
import { ResendVerification } from '../components/ResendVerification'
import type { VerificationResult } from '../verificationLoader'

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const attempt = params.get('attempt')
  const verification = useQuery<VerificationResult>({
    queryKey: ['email-verification', attempt],
    enabled: false,
    gcTime: Infinity,
    staleTime: Infinity,
  })
  const loading = verification.fetchStatus === 'fetching'
  const success = verification.data === 'success'
  const invalid = !verification.data || verification.data === 'invalid'

  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{loading ? 'Verifying your email' : success ? 'Email verified successfully' : invalid ? 'Verification link unavailable' : 'Unable to verify your email'}</h1>
        <p role={loading || success ? 'status' : 'alert'} className="text-sm leading-relaxed text-muted-foreground">
          {loading ? 'Please wait while we verify your email address.' : success ? 'Your email address is now verified. You can continue using Docvia.' : invalid ? 'This link is missing, invalid, expired or has already been used. You can request a new email below.' : verification.data === 'network-error' ? 'We could not confirm verification because of a connection problem. Check your profile status or request a new verification email.' : 'Verification could not be completed. Please try requesting a new email later.'}
        </p>
        <Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring">Go to Login</Link>
      </div>
      {!loading && !success && <div className="mt-6 border-t border-border pt-5"><ResendVerification /></div>}
    </AuthLayout>
  )
}
