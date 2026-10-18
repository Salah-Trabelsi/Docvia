import { useState } from 'react'
import { CalendarDays, Check, Clock3, Heart, MapPin, Star } from 'lucide-react'
import { Link } from 'react-router'
import type { Doctor } from '../types/doctor.types'
import { getAvailabilityLabel } from '../utils/availability'
import { useAvailabilityClock } from '../hooks/useAvailabilityClock'

interface DoctorCardProps {
  doctor: Doctor
}

export function DoctorCard({ doctor }: DoctorCardProps) {
  const [favorite, setFavorite] = useState(false)
  const name = `Dr. ${doctor.firstName} ${doctor.lastName}`
  const now = useAvailabilityClock()
  const { availableToday, label: availabilityLabel } = getAvailabilityLabel(doctor, now)

  return (
    <article className="relative rounded-xl bg-card p-4 text-card-foreground shadow-card transition-shadow hover:shadow-panel">
      <Link to={`/doctors/${doctor._id}`} aria-label={`View ${name}'s profile`} className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" />
      <button
        type="button"
        aria-label={`${favorite ? 'Remove' : 'Add'} ${name} ${favorite ? 'from' : 'to'} favorites`}
        aria-pressed={favorite}
        onClick={() => setFavorite(value => !value)}
        className={`absolute top-1 right-1 z-20 flex size-11 items-center justify-center rounded-full ${favorite ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'}`}
      >
        <Heart aria-hidden="true" className="size-4" fill={favorite ? 'currentColor' : 'none'} strokeWidth={1.6} />
      </button>

      <div className="flex items-center gap-3">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
          <img src={doctor.imageUrl} alt={name} className="size-full object-cover" />
        </div>
        <div className="min-w-0 pt-3">
          <h3 className="pr-2 text-sm leading-snug font-semibold">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{doctor.professionalTitle}</p>
          <p className="mt-2 flex flex-wrap items-center gap-1 text-xs">
            <Star aria-hidden="true" className="size-4 fill-primary text-primary" />
            <span className="font-semibold"><span className="sr-only">Rated </span>{(doctor.rating ?? 0).toFixed(1)}<span className="sr-only"> out of 5</span></span>
            <span className="text-muted-foreground">({doctor.reviewCount} reviews)</span>
          </p>
        </div>
      </div>
      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />{doctor.yearsOfExperience}+ Years Experience</p>
        <p className="flex items-center gap-2"><MapPin aria-hidden="true" className="size-4 shrink-0" />{doctor.city}</p>
      </div>
      <p className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${availableToday ? 'bg-success-subtle text-success' : 'bg-accent text-accent-foreground'}`}>
        {availableToday ? <Check aria-hidden="true" className="size-3.5" /> : <Clock3 aria-hidden="true" className="size-3.5" />}
        {availabilityLabel}
      </p>
    </article>
  )
}

