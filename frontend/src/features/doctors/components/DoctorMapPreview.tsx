import { useEffect, useRef, useState } from 'react'
import { MapPin, Star, UserRound, X } from 'lucide-react'
import { Link } from 'react-router'
import type { Doctor } from '../types/doctor.types'

interface DoctorMapPreviewProps {
  doctor: Doctor
  practiceDoctors: Doctor[]
  onSelect: (id: string) => void
  onClose: () => void
}

export function DoctorMapPreview({ doctor, practiceDoctors, onSelect, onClose }: DoctorMapPreviewProps) {
  const previewRef = useRef<HTMLElement>(null)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    previewRef.current?.focus({ preventScroll: true })
  }, [doctor._id])

  return (
    <section
      ref={previewRef}
      tabIndex={-1}
      aria-labelledby="map-doctor-name"
      onKeyDown={event => { if (event.key === 'Escape') onClose() }}
      className="absolute right-3 bottom-10 left-3 z-10 max-h-[calc(100%-8rem)] overflow-y-auto overscroll-contain rounded-xl bg-card p-4 text-card-foreground shadow-card"
    >
      <button type="button" aria-label="Close doctor preview" onClick={onClose} className="absolute top-1 right-1 flex size-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
        <X aria-hidden="true" className="size-4" />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
          {!imageFailed && doctor.imageUrl ? (
            <img
              src={doctor.imageUrl}
              alt=""
              className="size-full object-cover object-top"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <UserRound aria-hidden="true" className="size-7" />
          )}
        </div>
        <div className="min-w-0">
          <h3 id="map-doctor-name" className="text-sm font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{doctor.professionalTitle}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <Star aria-hidden="true" className="size-4 fill-primary text-primary" />
            <span className="font-semibold"><span className="sr-only">Rated </span>{doctor.rating.toFixed(1)}<span className="sr-only"> out of 5</span></span>
            <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
          </p>
        </div>
      </div>
      {practiceDoctors.length > 1 && (
        <label className="mt-3 block text-xs text-muted-foreground">
          Doctors at this location
          <select value={doctor._id} onChange={event => onSelect(event.target.value)} className="mt-1 min-h-11 w-full min-w-0 rounded-lg border border-input bg-card px-2 text-sm text-foreground">
            {practiceDoctors.map(item => <option key={item._id} value={item._id}>Dr. {item.firstName} {item.lastName}</option>)}
          </select>
        </label>
      )}
      <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
        <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <p className="min-w-0 break-words"><span className="block font-medium text-foreground">{doctor.practice.name} · {doctor.practice.city}</span>{doctor.practice.address}</p>
      </div>
      <Link to={`/doctors/${doctor._id}`} className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/80">View Profile</Link>
    </section>
  )
}

