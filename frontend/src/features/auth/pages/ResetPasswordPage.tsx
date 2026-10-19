import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Eye, EyeOff, LockKeyhole } from 'lucide-react'
import { resetPassword, type ResetPasswordResult } from '@/api/auth'
import { consumeResetToken, hasResetToken } from '../resetPasswordLoader'
import { AuthLayout } from '../components/AuthLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'

interface PasswordValues { password: string; confirmation: string }

export function ResetPasswordPage() {
  const [available] = useState(hasResetToken)
  const [visible, setVisible] = useState({ password: false, confirmation: false })
  const submitting = useRef(false)
  const client = useQueryClient()
  const { register, handleSubmit, getValues, reset, formState: { errors } } = useForm<PasswordValues>({ defaultValues: { password: '', confirmation: '' }, mode: 'onTouched' })
  const mutation = useMutation<ResetPasswordResult, Error, void>({
    // No sensitive mutation variables: consume the memory handoff only here.
    mutationFn: async () => {
      const token = consumeResetToken()
      const password = getValues('password')
      reset()
      if (!token) return 'invalid'
      return resetPassword(token, password)
    },
    retry: false,
    gcTime: 0,
    onSuccess: async result => {
      if (result !== 'success') return
      await client.cancelQueries()
      client.removeQueries({ predicate: query => query.queryKey[0] !== 'auth' })
      client.setQueryData(['auth', 'me'], null)
    },
  })
  const result = mutation.data
  const invalid = !available || result === 'invalid'

  return (
    <AuthLayout>
      <div className="mb-7 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{result === 'success' ? 'Password reset successfully' : invalid ? 'Reset link unavailable' : 'Reset your password'}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{result === 'success' ? 'Sign in with your new password. Your previous sessions have been signed out.' : invalid ? 'This link is missing, invalid, expired or already used. Request a new link, or reopen the link from your email if you refreshed this page.' : 'Choose a new password for your Docvia account.'}</p>
      </div>
      {available && !result && !mutation.isError && <form noValidate aria-busy={mutation.isPending} className="space-y-5" onSubmit={event => handleSubmit(() => {
        if (submitting.current) return
        submitting.current = true
        mutation.mutate()
      })(event)}>
        {(['password', 'confirmation'] as const).map(name => (
          <div key={name} className="space-y-2">
            <Label htmlFor={`reset-${name}`}>{name === 'password' ? 'New Password' : 'Confirm Password'}</Label>
            <div className="relative">
              <LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-muted-foreground" />
              <Input id={`reset-${name}`} type={visible[name] ? 'text' : 'password'} autoComplete="new-password" className="h-12 pr-12 pl-11" disabled={mutation.isPending} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `reset-${name}-error` : 'reset-password-hint'} {...register(name, {
                required: 'This field is required.',
                validate: value => name === 'confirmation' ? value === getValues('password') || 'Passwords must match.' : (value.length >= 8 && new TextEncoder().encode(value).length <= 72) || 'Use at least 8 characters and at most 72 UTF-8 bytes.',
              })} />
              <Button type="button" variant="ghost" size="icon" disabled={mutation.isPending} className="absolute top-1 right-1 size-10 text-muted-foreground" aria-label={`${visible[name] ? 'Hide' : 'Show'} ${name === 'password' ? 'new password' : 'confirmed password'}`} aria-pressed={visible[name]} onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>{visible[name] ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
            </div>
            <FieldError id={`reset-${name}-error`} errors={[errors[name]]} />
          </div>
        ))}
        <p id="reset-password-hint" className="text-xs leading-relaxed text-muted-foreground">Use at least 8 characters, up to 72 UTF-8 bytes. Some characters use more than one byte.</p>
        <Button type="submit" disabled={mutation.isPending} className="h-12 w-full text-base">{mutation.isPending ? 'Resetting password...' : 'Reset Password'}</Button>
      </form>}
      {result === 'network-error' && <FieldError>We could not confirm the reset because of a connection problem. Try signing in with your new password or request a new reset link.</FieldError>}
      {(result === 'server-error' || mutation.isError) && <FieldError>Unable to confirm the password reset. Please request a new link and try again later.</FieldError>}
      {result === 'rate-limited' && <FieldError>Too many requests. Please wait before reopening your email link or requesting another.</FieldError>}
      {(invalid || (result && result !== 'success') || mutation.isError) && <p className="mt-5 text-center"><Link to="/forgot-password" className="text-sm font-medium text-brand-foreground hover:underline">Request a new reset link</Link></p>}
      <p className="mt-6 text-center"><Link to="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground focus-visible:outline-2 focus-visible:outline-ring">Return to Login</Link></p>
    </AuthLayout>
  )
}
