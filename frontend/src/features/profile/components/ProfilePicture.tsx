import { useEffect, useId, useRef, useState, type ChangeEvent } from 'react'
import { Camera, Upload, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadAvatar, type UserProfile } from '@/api/profile'
import { authErrorMessage } from '@/api/auth'

const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp']
const maxFileSize = 2 * 1024 * 1024

export function ProfilePicture({ avatarUrl }: { avatarUrl?: string }) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>()
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [failedUrl, setFailedUrl] = useState<string>()
  const queryClient = useQueryClient()
  const upload = useMutation({
    mutationFn: (file: File) => uploadAvatar(file, setProgress),
    onSuccess: async result => {
      await queryClient.cancelQueries({ queryKey: ['profile', 'me'] })
      queryClient.setQueryData<UserProfile>(['profile', 'me'], current => current ? { ...current, avatarUrl: result.avatarUrl } : current)
      setFailedUrl(undefined)
      setError('')
      setMessage('Profile photo saved.')
    },
    onError: failure => { setError(authErrorMessage(failure)) },
    onSettled: () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
      setPreviewUrl(undefined)
    },
  })
  const disabled = upload.isPending

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const selectPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow selecting the same file again, including after a validation error.
    event.target.value = ''
    if (!file || disabled) return
    setMessage('')
    if (!acceptedTypes.includes(file.type)) {
      setError('Please choose a JPG, PNG or WebP image.')
      return
    }
    if (file.size > maxFileSize) {
      setError('This image is too large. Please choose a file of 2MB or less.')
      return
    }
    if (file.size === 0) {
      setError('This file is empty. Please choose another image.')
      return
    }
    const nextUrl = URL.createObjectURL(file)
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    objectUrlRef.current = nextUrl
    setPreviewUrl(nextUrl)
    setError('')
    setProgress(0)
    upload.mutate(file)
  }

  const imageFailed = (url: string) => {
    if (objectUrlRef.current !== url) return
    URL.revokeObjectURL(url)
    objectUrlRef.current = null
    setPreviewUrl(undefined)
    setError('This image could not be opened. Please choose another JPG, PNG or WebP file.')
  }

  const descriptionId = `${id}-requirements`
  const errorId = `${id}-error`
  const describedBy = error ? `${descriptionId} ${errorId}` : descriptionId
  const imageUrl = previewUrl || (avatarUrl !== failedUrl ? avatarUrl : undefined)

  return (
    <section aria-labelledby={`${id}-heading`} aria-busy={disabled} className="min-w-0 rounded-xl bg-card p-5 shadow-card">
      <h2 id={`${id}-heading`} className="text-base font-semibold">Profile Picture</h2>
      <div className="relative mx-auto mt-6 aspect-square w-36 max-w-full sm:w-40">
        <div className="flex size-full items-center justify-center overflow-hidden rounded-full bg-muted text-muted-foreground">
          {imageUrl ? <img src={imageUrl} alt="Your profile photo" className="size-full object-cover" onError={() => { if (previewUrl) imageFailed(previewUrl); else setFailedUrl(avatarUrl) }} /> : <UserRound aria-label="Default profile photo" role="img" className="size-20" strokeWidth={1.2} />}
        </div>
        <Button disabled={disabled} type="button" variant="outline" size="icon" className="absolute right-0 bottom-0 size-11 rounded-full bg-card shadow-sm" aria-label="Choose profile photo" aria-describedby={describedBy} onClick={() => inputRef.current?.click()}>
          <Camera aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <p id={descriptionId} className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">JPG, PNG or WebP. Max size 2MB.</p>
      <input disabled={disabled} ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Profile photo file" aria-describedby={describedBy} aria-invalid={!!error} onChange={selectPhoto} />
      <Button disabled={disabled} type="button" variant="outline" className="mt-3 min-h-11 w-full bg-card" aria-describedby={describedBy} onClick={() => inputRef.current?.click()}>
        <Upload aria-hidden="true" className="size-4" />{disabled ? 'Uploading...' : 'Change Photo'}
      </Button>
      {disabled && <div className="mt-3 space-y-2">
        <progress value={progress} max={100} aria-label="Photo upload progress" className="h-2 w-full accent-primary" />
        <p role="status" className="text-center text-xs text-muted-foreground">{progress < 100 ? `Uploading ${progress}%` : 'Processing and saving your photo...'}</p>
      </div>}
      {message && <p role="status" className="mt-3 text-center text-xs text-success">{message}</p>}
      {error && <FieldError id={errorId} className="mt-3">{error}</FieldError>}
    </section>
  )
}

