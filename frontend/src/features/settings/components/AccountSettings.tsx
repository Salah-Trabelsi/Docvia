import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { KeyRound, Mail, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldError } from '@/components/ui/field'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { emailSchema, passwordSchema } from '../schemas/accountSettingsSchema'

function PasswordForm() {
  const id = useId()
  const [notice, setNotice] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema), mode: 'onTouched', defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' } })
  return <form noValidate className="space-y-4" onSubmit={handleSubmit(() => { reset(); setNotice('Password format validated. Your password has not been changed; account services are not connected yet.') })}>
    {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((name, index) => <div key={name} className="space-y-2">
      <Label htmlFor={`${id}-${name}`}>{['Current Password', 'New Password', 'Confirm New Password'][index]}</Label>
      <Input {...register(name)} id={`${id}-${name}`} type="password" autoComplete={index === 0 ? 'current-password' : 'new-password'} className="min-h-11" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />
      {errors[name] && <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>}
    </div>)}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <DialogFooter><DialogClose render={<Button type="button" variant="outline" className="min-h-11" />}>Cancel</DialogClose><Button type="submit" className="min-h-11">Validate Password</Button></DialogFooter>
  </form>
}

function EmailForm() {
  const id = useId()
  const [notice, setNotice] = useState('')
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema), mode: 'onTouched', defaultValues: { email: '', confirmEmail: '' } })
  return <form noValidate className="space-y-4" onSubmit={handleSubmit(() => setNotice('Email format validated. Your email has not been changed and no verification email has been sent.'))}>
    {(['email', 'confirmEmail'] as const).map((name, index) => <div key={name} className="space-y-2">
      <Label htmlFor={`${id}-${name}`}>{index === 0 ? 'New Email Address' : 'Confirm Email Address'}</Label>
      <Input {...register(name)} id={`${id}-${name}`} type="email" autoComplete="email" className="min-h-11" aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} />
      {errors[name] && <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>}
    </div>)}
    {notice && <p role="status" className="text-sm text-muted-foreground">{notice}</p>}
    <DialogFooter><DialogClose render={<Button type="button" variant="outline" className="min-h-11" />}>Cancel</DialogClose><Button type="submit" className="min-h-11">Validate Email</Button></DialogFooter>
  </form>
}

const actions = [
  { id: 'password', title: 'Change Password', description: 'Keep your account secure with a strong password.', icon: KeyRound, button: 'Change Password' },
  { id: 'email', title: 'Update Email', description: 'Manage the email address associated with your account.', icon: Mail, button: 'Update Email' },
  { id: 'delete', title: 'Delete Account', description: 'Review the permanent removal of your account.', icon: Trash2, button: 'Delete Account' },
] as const

export function AccountSettings({ securityOnly = false }: { securityOnly?: boolean }) {
  return <section aria-labelledby="account-settings-heading" className="min-w-0 rounded-xl bg-card p-5 shadow-card">
    <h2 id="account-settings-heading" className="text-lg font-semibold">{securityOnly ? 'Security' : 'Account Settings'}</h2>
    <div className="mt-2 divide-y divide-border">
      {actions.filter(action => !securityOnly || action.id === 'password').map(({ id, title, description, icon: Icon, button }) => <div key={id} className="flex flex-wrap items-start gap-3 py-5">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${id === 'delete' ? 'bg-destructive/10 text-destructive' : 'bg-accent text-brand-foreground'}`}><Icon aria-hidden="true" className="size-5" /></span>
        <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
          <Dialog><DialogTrigger render={<Button variant={id === 'delete' ? 'destructive' : 'outline'} className="mt-3 min-h-11 max-w-full whitespace-normal" />}>{button}</DialogTrigger>
            <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
              <DialogHeader><DialogTitle className="pr-8">{id === 'delete' ? 'Delete your account?' : title}</DialogTitle><DialogDescription>{id === 'delete' ? 'Deleting an account is permanent. This preview cannot delete your account or any data because account services are not connected.' : 'Preview only. You can validate these fields, but account changes are not available yet.'}</DialogDescription></DialogHeader>
              {id === 'password' ? <PasswordForm /> : id === 'email' ? <EmailForm /> : <DialogFooter><DialogClose render={<Button variant="outline" className="min-h-11" />}>Keep Account</DialogClose><Button variant="destructive" disabled className="min-h-11">Delete Account</Button></DialogFooter>}
            </DialogContent>
          </Dialog>
        </div>
      </div>)}
    </div>
  </section>
}

