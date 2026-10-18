import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { updateProfile, type UserProfile } from '@/api/profile'
import { authErrorMessage, type AuthUser } from '@/api/auth'
import { profileSchema, type ProfileFormValues } from '../schemas/profileSchema'
import { emergencyContactSchema, type EmergencyContactValues } from '../schemas/emergencyContactSchema'
import { ProfilePicture } from './ProfilePicture'
import { PersonalInformation } from './PersonalInformation'
import { AccountInformation } from './AccountInformation'
import { EmergencyContact } from './EmergencyContact'

function formValues(profile: UserProfile): ProfileFormValues {
  return {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone ?? '',
    dateOfBirth: profile.dateOfBirth?.slice(0, 10) ?? '',
    gender: profile.gender ?? '',
    streetAddress: profile.streetAddress ?? '',
    city: profile.city ?? '',
    postalCode: profile.postalCode ?? '',
    country: profile.country ?? '',
  }
}

function contactValues(profile: UserProfile): EmergencyContactValues {
  return { contactName: profile.emergencyContact?.name ?? '', relationship: profile.emergencyContact?.relationship ?? '', phone: profile.emergencyContact?.phone ?? '' }
}

export function ProfileDetails({ profile }: { profile: UserProfile }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const form = useForm<ProfileFormValues>({ resolver: zodResolver(profileSchema), defaultValues: formValues(profile), mode: 'onTouched' })
  const [contactEditing, setContactEditing] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [contactError, setContactError] = useState('')
  const emergencyForm = useForm<EmergencyContactValues>({ resolver: zodResolver(emergencyContactSchema), defaultValues: contactValues(profile), mode: 'onTouched' })
  const { reset: resetContact } = emergencyForm
  const { reset } = form

  useEffect(() => {
    if (!editing) reset(formValues(profile))
  }, [profile, editing, reset])

  useEffect(() => {
    if (!contactEditing) resetContact(contactValues(profile))
  }, [profile, contactEditing, resetContact])

  const saveContact = useMutation({
    mutationFn: updateProfile,
    onSuccess: async updated => {
      await queryClient.cancelQueries({ queryKey: ['profile', 'me'] })
      queryClient.setQueryData<UserProfile>(['profile', 'me'], current => current ? { ...current, emergencyContact: updated.emergencyContact } : updated)
      resetContact(contactValues(updated))
      setContactEditing(false)
      setContactMessage(updated.emergencyContact ? 'Emergency contact saved.' : 'Emergency contact cleared.')
    },
  })

  const saveContactChanges = emergencyForm.handleSubmit(async values => {
    setContactError('')
    setContactMessage('')
    try {
      await saveContact.mutateAsync({ emergencyContact: values.contactName || values.relationship || values.phone
        ? { name: values.contactName, relationship: values.relationship, phone: values.phone } : null })
    } catch (failure) {
      if (axios.isAxiosError<{ errors?: { fieldErrors?: { emergencyContact?: string[] } } }>(failure)) {
        const details = failure.response?.data?.errors?.fieldErrors?.emergencyContact
        if (details?.length) { setContactError(details.join(' ')); return }
      }
      setContactError(authErrorMessage(failure))
    }
  })

  const save = useMutation({
    mutationFn: updateProfile,
    onSuccess: async updated => {
      // Prevent an older in-flight read from overwriting the saved values.
      await queryClient.cancelQueries({ queryKey: ['profile', 'me'] })
      await queryClient.cancelQueries({ queryKey: ['auth', 'me'] })
      queryClient.setQueryData<UserProfile>(['profile', 'me'], current => current ? { ...updated, emergencyContact: current.emergencyContact, avatarUrl: current.avatarUrl } : updated)
      queryClient.setQueryData<AuthUser | null>(['auth', 'me'], current => current ? {
        ...current, firstName: updated.firstName, lastName: updated.lastName,
        email: updated.email, role: updated.role,
      } : current)
      reset(formValues(updated))
      setEditing(false)
      setMessage('Your profile has been saved.')
    },
  })

  const saveChanges = form.handleSubmit(async values => {
    setError('')
    setMessage('')
    try {
      await save.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        phone: values.phone,
        dateOfBirth: values.dateOfBirth || null,
        ...(values.gender ? { gender: values.gender } : {}),
        streetAddress: values.streetAddress,
        city: values.city,
        postalCode: values.postalCode,
        country: values.country,
      })
    } catch (failure) {
      if (axios.isAxiosError<{ errors?: { fieldErrors?: Record<string, string[]> } }>(failure)) {
        const fields = failure.response?.data?.errors?.fieldErrors
        for (const name of Object.keys(formValues(profile)) as (keyof ProfileFormValues)[]) {
          const fieldMessage = fields?.[name]?.[0]
          if (fieldMessage) form.setError(name, { type: 'server', message: fieldMessage })
        }
      }
      setError(authErrorMessage(failure))
    }
  })

  return (
    <div className="grid min-w-0 grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,25fr)_minmax(0,45fr)_minmax(0,30fr)]">
      <ProfilePicture avatarUrl={profile.avatarUrl} />
      <PersonalInformation form={form} editing={editing} saving={save.isPending}
        onEdit={() => { setEditing(true); setError(''); setMessage('') }}
        onCancel={() => { reset(formValues(profile)); setEditing(false); setError(''); setMessage('') }}
        onSave={() => { void saveChanges() }} message={message} error={error} />
      <div className="flex min-w-0 flex-col gap-5">
        <AccountInformation account={{
          accountType: profile.role === 'admin' ? 'Admin' : 'Patient',
          memberSince: profile.createdAt,
          emailVerified: profile.isEmailVerified,
          status: profile.isActive ? 'Active' : 'Inactive',
        }} />
        <EmergencyContact form={emergencyForm} editing={contactEditing}
          onEdit={() => { setContactEditing(true); setContactError(''); setContactMessage('') }}
          onClear={() => { resetContact({ contactName: '', relationship: '', phone: '' }); setContactError(''); setContactMessage('Click Save Changes to clear the saved contact.') }}
          onSave={() => { void saveContactChanges() }}
          onCancel={() => { resetContact(contactValues(profile)); setContactEditing(false); setContactError(''); setContactMessage('') }}
          saving={saveContact.isPending} message={contactMessage} error={contactError} />
      </div>
    </div>
  )
}
