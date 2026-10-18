import { useId } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { FieldError } from '@/components/ui/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { countryOptions, genderOptions, type ProfileFormValues } from '../schemas/profileSchema'

interface PersonalInformationProps {
  form: UseFormReturn<ProfileFormValues>
  editing: boolean
  saving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  message: string
  error: string
}

export function PersonalInformation({ form, editing, saving, onEdit, onCancel, onSave, message, error }: PersonalInformationProps) {
  const id = useId()
  const { register, control, formState: { errors } } = form
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

  const inputField = (name: Exclude<keyof ProfileFormValues, 'gender' | 'country'>, label: string, type = 'text', autoComplete?: string) => (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={`${id}-${name}`} className="leading-snug">{label}</Label>
      <Input {...register(name)} id={`${id}-${name}`} type={type} autoComplete={autoComplete}
        required={name === 'firstName' || name === 'lastName'}
        readOnly={!editing || saving || name === 'email'} max={name === 'dateOfBirth' ? today : undefined}
        aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined}
        className={`min-h-11 ${name === 'email' ? 'bg-muted text-muted-foreground' : ''}`} />
      {errors[name] && <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>}
    </div>
  )

  const selectField = (name: 'gender' | 'country', label: string, options: readonly string[]) => (
    <Controller name={name} control={control} render={({ field }) => (
      <div className="min-w-0 space-y-2">
        <Label htmlFor={`${id}-${name}`}>{label}</Label>
        <Select disabled={!editing || saving} name={field.name} value={field.value} onValueChange={value => { if (value !== null) field.onChange(value) }}>
          <SelectTrigger ref={field.ref} id={`${id}-${name}`} onBlur={field.onBlur} aria-invalid={!!errors[name]} aria-describedby={errors[name] ? `${id}-${name}-error` : undefined} className="min-h-11 w-full min-w-0">
            <SelectValue className="min-w-0 truncate">{field.value || 'Not specified'}</SelectValue>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>{[...new Set([...options, ...(field.value ? [field.value] : [])])].map(option => <SelectItem key={option} value={option} className="min-h-11">{option}</SelectItem>)}</SelectContent>
        </Select>
        {errors[name] && <FieldError id={`${id}-${name}-error`}>{errors[name]?.message}</FieldError>}
      </div>
    )} />
  )

  return (
    <section aria-labelledby={`${id}-heading`} className="min-w-0 rounded-xl bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="text-base font-semibold">Personal Information</h2>
        {!editing && <Button type="button" variant="outline" onClick={onEdit}>Edit Profile</Button>}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Update your personal details</p>
      <form noValidate aria-busy={saving} onSubmit={event => { event.preventDefault(); if (editing && !saving) onSave() }} className="mt-4 space-y-6">
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
          {inputField('firstName', 'First Name', 'text', 'given-name')}
          {inputField('lastName', 'Last Name', 'text', 'family-name')}
          {inputField('email', 'Email Address', 'email', 'email')}
          {inputField('phone', 'Phone Number', 'tel', 'tel')}
          {inputField('dateOfBirth', 'Date of Birth', 'date', 'bday')}
          {selectField('gender', 'Gender', genderOptions)}
        </div>
        <section aria-labelledby={`${id}-address-heading`}>
          <h3 id={`${id}-address-heading`} className="text-sm font-semibold">Address Information</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">This information helps us show you relevant doctors in your area.</p>
          <div className="mt-4 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            {inputField('streetAddress', 'Street Address', 'text', 'street-address')}
            {inputField('city', 'City', 'text', 'address-level2')}
            {inputField('postalCode', 'Postal Code', 'text', 'postal-code')}
            {selectField('country', 'Country', countryOptions)}
          </div>
        </section>
        {editing && <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" disabled={saving} onClick={onCancel}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>}
        {error && <FieldError>{error}</FieldError>}
        {message && <p role="status" className="text-sm text-success">{message}</p>}
      </form>
    </section>
  )
}

