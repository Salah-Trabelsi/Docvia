import { useId, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { Eye, EyeOff } from 'lucide-react'
import { deleteAccount, DeleteAccountError } from '@/api/auth'
import { useAuth } from '@/features/auth/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'
import { DialogClose, DialogFooter } from '@/components/ui/dialog'

export function DeleteAccountForm({ onClose, onBusy }: { onClose: () => void; onBusy: (busy: boolean) => void }) {
  const id = useId()
  const { user } = useAuth()
  const client = useQueryClient()
  const navigate = useNavigate()
  const submitting = useRef(false)
  const [visible, setVisible] = useState(false)
  const { register, handleSubmit, getValues, reset, formState: { errors, isValid } } = useForm<{ email: string; password: string }>({
    defaultValues: { email: '', password: '' }, mode: 'onChange',
  })
  const mutation = useMutation({
    mutationFn: () => {
      const values = getValues()
      return deleteAccount({ email: values.email.trim().toLowerCase(), password: values.password })
    },
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
      reset()
      await client.cancelQueries()
      client.removeQueries({ predicate: query => !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'me') })
      client.setQueryData(['auth', 'me'], null)
      client.getMutationCache().clear()
      onClose()
      navigate('/login', { replace: true, state: { accountDeleted: true } })
    },
    onError: error => {
      if (error instanceof DeleteAccountError && error.status === 401) {
        reset()
        onClose()
        navigate('/login', { replace: true })
      }
    },
  })

  return <form noValidate aria-busy={mutation.isPending} className="space-y-4" onSubmit={event => handleSubmit(async () => {
    if (submitting.current || !user) return
    submitting.current = true
    onBusy(true)
    try { await mutation.mutateAsync() } catch { /* Safe error is displayed below. */ }
    finally { submitting.current = false; onBusy(false) }
  })(event)}>
    <p className="break-words rounded-lg bg-accent p-3 text-sm">Account: <span className="font-medium">{user?.email}</span></p>
    <div className="space-y-2">
      <Label htmlFor={`${id}-email`}>Email address</Label>
      <Input id={`${id}-email`} type="email" autoComplete="email" disabled={mutation.isPending} className="min-h-11" aria-invalid={!!errors.email} aria-describedby={errors.email ? `${id}-email-error` : undefined} {...register('email', {
        required: 'Enter your account email address.',
        validate: value => {
          const email = value.trim().toLowerCase()
          if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.'
          return email === user?.email.trim().toLowerCase() || 'The email must match your account email address.'
        },
      })} />
      <FieldError id={`${id}-email-error`} errors={[errors.email]} />
    </div>
    <div className="space-y-2">
      <Label htmlFor={`${id}-password`}>Current password</Label>
      <div className="relative">
        <Input id={`${id}-password`} type={visible ? 'text' : 'password'} autoComplete="current-password" disabled={mutation.isPending} className="min-h-11 pr-12" aria-invalid={!!errors.password} aria-describedby={errors.password ? `${id}-password-error` : undefined} {...register('password', {
          required: 'Enter your current password.',
          validate: value => (value.length >= 8 && new TextEncoder().encode(value).length <= 72) || 'Use at least 8 characters and at most 72 UTF-8 bytes.',
        })} />
        <Button type="button" variant="ghost" size="icon" disabled={mutation.isPending} className="absolute top-0.5 right-0.5 size-10 text-muted-foreground" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(value => !value)}>{visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}</Button>
      </div>
      <FieldError id={`${id}-password-error`} errors={[errors.password]} />
    </div>
    {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}
    <DialogFooter>
      <DialogClose disabled={mutation.isPending} render={<Button type="button" variant="outline" className="min-h-11" />}>Cancel</DialogClose>
      <Button type="submit" variant="destructive" disabled={!isValid || !user || mutation.isPending} className="min-h-11">{mutation.isPending ? 'Deleting account...' : 'Delete Account'}</Button>
    </DialogFooter>
  </form>
}
