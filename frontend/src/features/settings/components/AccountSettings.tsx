import { useId, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { changePassword } from '@/api/auth'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, KeyRound, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { passwordSchema } from '../schemas/accountSettingsSchema'
import { EmailChangeForm } from './EmailChangeForm'
import { DeleteAccountForm } from './DeleteAccountForm'

function PasswordForm() {
  const id = useId()
  const [visible, setVisible] = useState({ currentPassword: false, newPassword: false, confirmPassword: false })
  const submitting = useRef(false)
  const client = useQueryClient()
  const navigate = useNavigate()
  const { register, handleSubmit, getValues, reset, formState: { errors } } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema), mode: 'onTouched', defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  const mutation = useMutation({
    mutationFn: () => {
      const { currentPassword, newPassword } = getValues()
      return changePassword({ currentPassword, newPassword })
    },
    retry: false,
    gcTime: 0,
    onSuccess: async () => {
      reset()
      await client.cancelQueries()
      client.removeQueries({ predicate: query => !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'me') })
      client.setQueryData(['auth', 'me'], null)
      navigate('/login', { replace: true, state: { passwordChanged: true } })
    },
  })
  return <form noValidate aria-busy={mutation.isPending} className="space-y-4" onSubmit={event => handleSubmit(async () => {
    if (submitting.current) return
    submitting.current = true
    try { await mutation.mutateAsync() } catch { /* Display the safe mutation error below. */ }
    finally { submitting.current = false }
  })(event)}>
    {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((name, index) => <div key={name} className="space-y-2">
      <Label htmlFor={`${id}-${name}`}>{['Current Password', 'New Password', 'Confirm New Password'][index]}</Label>
      <div className="relative">
        <Input {...register(name)} id={`${id}-${name}`} type={visible[name] ? 'text' : 'password'} disabled={mutation.isPending} autoComplete={index === 0 ? 'current-password' : 'new-password'} className="min-h-11 pr-12" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />
        <Button type="button" variant="ghost" size="icon" disabled={mutation.isPending} className="absolute top-0.5 right-0.5 size-10 text-muted-foreground" aria-label={`${visible[name] ? 'Hide' : 'Show'} ${['current password', 'new password', 'password confirmation'][index]}`} aria-pressed={visible[name]} onClick={() => setVisible(current => ({ ...current, [name]: !current[name] }))}>
          {visible[name] ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </Button>
      </div>
      {errors[name] && <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>}
    </div>)}
    {mutation.isError && <FieldError>{mutation.error.message}</FieldError>}
    <DialogFooter><DialogClose disabled={mutation.isPending} render={<Button type="button" variant="outline" className="min-h-11" />}>Cancel</DialogClose><Button type="submit" disabled={mutation.isPending} className="min-h-11">{mutation.isPending ? 'Changing password...' : 'Change Password'}</Button></DialogFooter>
  </form>
}

const actions = [
  { id: 'password', title: 'Change Password', description: 'Keep your account secure with a strong password.', icon: KeyRound, button: 'Change Password' },
  { id: 'email', title: 'Update Email', description: 'Manage the email address associated with your account.', icon: Mail, button: 'Update Email' },
  { id: 'delete', title: 'Delete Account', description: 'Review the permanent removal of your account.', icon: Trash2, button: 'Delete Account' },
] as const

export function AccountSettings({ securityOnly = false }: { securityOnly?: boolean }) {
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailMessage, setEmailMessage] = useState('')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  return <section aria-labelledby="account-settings-heading" className="min-w-0 rounded-xl bg-card p-5 shadow-card">
    <h2 id="account-settings-heading" className="text-lg font-semibold">{securityOnly ? 'Security' : 'Account Settings'}</h2>
    <div className="mt-2 divide-y divide-border">
      {actions.filter(action => !securityOnly || action.id === 'password').map(({ id, title, description, icon: Icon, button }) => <div key={id} className="flex flex-wrap items-start gap-3 py-5">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${id === 'delete' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-brand-foreground'}`}><Icon aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <Dialog {...(id === 'email' ? { open: emailOpen, onOpenChange: setEmailOpen } : id === 'delete' ? { open: deleteOpen, onOpenChange: (open: boolean) => { if (!deleting) setDeleteOpen(open) } } : {})}><DialogTrigger render={<Button variant={id === 'delete' ? 'destructive' : 'outline'} className="mt-3 min-h-11 max-w-full whitespace-normal" />}>{button}</DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <DialogHeader><DialogTitle className="pr-8">{title}</DialogTitle><DialogDescription>{id === 'delete' ? 'This action is permanent. Your account and associated profile data will be deleted. Enter your account email and current password to confirm.' : id === 'password' ? 'Use at least 8 characters and no more than 72 UTF-8 bytes. Changing your password signs you out of all sessions.' : 'Confirm your current password to send a verification link to your new email. Your email stays unchanged until you confirm.'}</DialogDescription></DialogHeader>
              {id === 'password' ? <PasswordForm /> : id === 'email' ? <EmailChangeForm onSuccess={() => { setEmailOpen(false); setEmailMessage('Confirmation email sent. Please check your new email inbox.') }} /> : <DeleteAccountForm onClose={() => setDeleteOpen(false)} onBusy={setDeleting} />}
            </DialogContent>
          </Dialog>
          {id === 'email' && emailMessage && <p role="status" className="mt-3 text-sm text-success">{emailMessage}</p>}
        </div>
      </div>)}
    </div>
  </section>
}

