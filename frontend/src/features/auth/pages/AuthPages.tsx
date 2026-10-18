import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router'
import { authErrorMessage, registerUser } from '@/api/auth'
import { useAuth } from '../useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'
import { AuthLayout } from '../components/AuthLayout'

interface AuthValues {
  firstName: string
  lastName: string
  email: string
  password: string
}

function AuthForm({ registration = false }: { registration?: boolean }) {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const routeState = location.state as { from?: unknown; registered?: boolean } | null
  const from = typeof routeState?.from === 'string' && routeState.from.startsWith('/')
    && !routeState.from.startsWith('//') && !routeState.from.includes('\\')
    && !/^\/(login|register|forgot-password)(?:[/?#]|$)/.test(routeState.from)
    ? routeState.from : '/'
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AuthValues>({
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
    mode: 'onTouched',
  })

  return (
    <AuthLayout>
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">{registration ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {registration ? 'Join Docvia to book appointments with trusted specialists.' : 'Sign in to access your account and manage your appointments.'}
        </p>
      </div>

      {!registration && routeState?.registered && <p role="status" className="mb-5 rounded-lg bg-success-subtle p-3 text-sm text-success">Account created. Please sign in.</p>}
      <form noValidate aria-busy={isSubmitting} className="space-y-5" onSubmit={handleSubmit(async values => {
        setNotice('')
        try {
          if (registration) {
            await registerUser({ firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim().toLowerCase(), password: values.password })
            navigate('/login', { replace: true, state: { registered: true, from } })
          } else {
            await login({ email: values.email.trim().toLowerCase(), password: values.password })
            navigate(from, { replace: true })
          }
        } catch (error) {
          setNotice(authErrorMessage(error))
        }
      })} onChange={() => setNotice('')}>
        {registration && (['firstName', 'lastName'] as const).map(name => (
          <div key={name} className="space-y-2">
            <Label htmlFor={name}>{name === 'firstName' ? 'First name' : 'Last name'}</Label>
            <div className="relative">
              <UserRound aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-muted-foreground" />
              <Input id={name} autoComplete={name === 'firstName' ? 'given-name' : 'family-name'} placeholder={name === 'firstName' ? 'First name' : 'Last name'} className="h-12 pl-11" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${name}-error` : undefined} {...register(name, { validate: value => !!value.trim() || 'This field is required.' })} />
            </div>
            <FieldError id={`${name}-error`} errors={[errors[name]]} />
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-muted-foreground" />
            <Input id="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" className="h-12 pl-11" aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} {...register('email', {
              required: 'Email is required.',
              validate: value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) || 'Enter a valid email address.',
            })} />
          </div>
          <FieldError id="email-error" errors={[errors.email]} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="pointer-events-none absolute top-3.5 left-3.5 size-5 text-muted-foreground" />
            <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete={registration ? 'new-password' : 'current-password'} placeholder={registration ? 'Create a password' : 'Enter your password'} className="h-12 pr-12 pl-11" aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : registration ? 'password-hint' : undefined} {...register('password', {
              required: 'Password is required.',
              ...(registration ? { minLength: { value: 8, message: 'Use at least 8 characters.' } } : {}),
            })} />
            <Button type="button" variant="ghost" size="icon" className="absolute top-1 right-1 size-10 text-muted-foreground" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)}>
              {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
            </Button>
          </div>
          {registration && <p id="password-hint" className="text-xs leading-relaxed text-muted-foreground">Use at least 8 characters.</p>}
          <FieldError id="password-error" errors={[errors.password]} />
          {!registration && <div className="pt-1 text-right"><Link to="/forgot-password" className="text-sm text-brand-foreground hover:underline">Forgot password?</Link></div>}
        </div>

        <Button type="submit" disabled={isSubmitting} className="h-12 w-full text-base">{isSubmitting ? (registration ? 'Creating account...' : 'Signing in...') : registration ? 'Create account' : 'Sign in'}</Button>
        {notice && <FieldError>{notice}</FieldError>}
      </form>

      <div className="my-6 flex items-center gap-4 text-sm text-muted-foreground" aria-hidden="true"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
      <p className="text-center text-sm leading-relaxed text-muted-foreground">
        {registration ? 'Already have an account?' : "Don't have an account?"}{' '}
        <Link to={registration ? '/login' : '/register'} state={{ from }} className="ml-1 font-medium text-brand-foreground hover:underline">{registration ? 'Sign in' : 'Register'}</Link>
      </p>
    </AuthLayout>
  )
}

export function LoginPage() {
  return <AuthForm key="login" />
}

export function RegisterPage() {
  return <AuthForm key="register" registration />
}

export function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Forgot password?</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">Password recovery is not available yet. No reset email can be sent at this stage.</p>
        <Link to="/login" className="inline-block py-2 font-medium text-brand-foreground hover:underline">Back to sign in</Link>
      </div>
    </AuthLayout>
  )
}
