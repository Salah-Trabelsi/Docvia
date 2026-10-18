import { useId } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { relationshipOptions, type EmergencyContactValues } from '../schemas/emergencyContactSchema'

interface EmergencyContactProps {
  editing: boolean
  onEdit: () => void
  onClear: () => void
  error: string
  form: UseFormReturn<EmergencyContactValues>
  onSave: () => void
  onCancel: () => void
  saving: boolean
  message: string
}

export function EmergencyContact({ form, onSave, onCancel, saving, message, editing, onEdit, onClear, error }: EmergencyContactProps) {
  const id = useId()
  const { register, control, formState: { errors } } = form

  return (
    <section aria-labelledby={`${id}-heading`} className="@container flex min-w-0 flex-1 flex-col rounded-xl bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={`${id}-heading`} className="text-base font-semibold">Emergency Contact</h2>
        {!editing && <Button type="button" variant="outline" onClick={onEdit}>Edit Contact</Button>}
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Optional emergency contact for urgent situations</p>
      <form noValidate aria-busy={saving} onSubmit={event => { event.preventDefault(); if (editing && !saving) onSave() }} className="mt-4 space-y-4">
        <fieldset disabled={saving} className="min-w-0 space-y-4">
        <div className="grid min-w-0 grid-cols-1 gap-4 @min-[16rem]:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor={`${id}-name`}>Contact Name</Label>
            <Input {...register('contactName')} readOnly={!editing} id={`${id}-name`} autoComplete="section-emergency name" className="min-h-11" placeholder="Full name" aria-invalid={!!errors.contactName} aria-describedby={errors.contactName ? `${id}-name-error` : undefined} />
            {errors.contactName && <FieldError id={`${id}-name-error`}>{errors.contactName.message}</FieldError>}
          </div>
          <Controller name="relationship" control={control} render={({ field }) => (
            <div className="min-w-0 space-y-2">
              <Label htmlFor={`${id}-relationship`}>Relationship</Label>
              <Select disabled={!editing || saving} name={field.name} value={field.value} onValueChange={value => field.onChange(value ?? '')}>
                <SelectTrigger ref={field.ref} id={`${id}-relationship`} onBlur={field.onBlur} className="min-h-11 w-full min-w-0" aria-invalid={!!errors.relationship} aria-describedby={errors.relationship ? `${id}-relationship-error` : undefined}>
                  <SelectValue className="min-w-0 truncate">{field.value || 'Select'}</SelectValue>
                </SelectTrigger>
                <SelectContent alignItemWithTrigger={false}>
                  <SelectItem value="" className="min-h-11">Not specified</SelectItem>
                  {relationshipOptions.map(option => <SelectItem key={option} value={option} className="min-h-11">{option}</SelectItem>)}
                  {field.value && !relationshipOptions.some(option => option === field.value) && <SelectItem value={field.value}>{field.value}</SelectItem>}
                </SelectContent>
              </Select>
              {errors.relationship && <FieldError id={`${id}-relationship-error`}>{errors.relationship.message}</FieldError>}
            </div>
          )} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${id}-phone`}>Phone Number</Label>
          <Input {...register('phone')} readOnly={!editing} id={`${id}-phone`} type="tel" autoComplete="section-emergency tel" placeholder="Include country code" className="min-h-11" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? `${id}-phone-error` : undefined} />
          {errors.phone && <FieldError id={`${id}-phone-error`}>{errors.phone.message}</FieldError>}
        </div>
        </fieldset>
      </form>
      {editing && <div className="mt-auto pt-5">
        <div className="-mx-5 -mb-5 rounded-b-xl border-t px-3 py-3">
          <Button type="button" variant="ghost" className="mb-2 text-brand-foreground" disabled={saving} onClick={onClear}>Clear Contact</Button>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" className="min-h-11 bg-card" disabled={saving} onClick={onCancel}>Cancel</Button>
            <Button type="button" className="h-auto min-h-11 whitespace-normal" disabled={saving} onClick={onSave}><Save aria-hidden="true" className="size-4 shrink-0" />{saving ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </div>
      </div>}
      {error && <FieldError className="mt-5">{error}</FieldError>}
      {message && <p role="status" className="mt-5 text-xs leading-relaxed text-muted-foreground">{message}</p>}
    </section>
  )
}

