import { Building2, CalendarDays, ChevronRight, Clock3, Languages, MapPin, Phone, Star, Stethoscope, UserRound } from 'lucide-react'
import { Link } from 'react-router'
import type { Doctor } from '../types/doctor.types'

export function DoctorDetailsSidebar({ doctor, allDoctors }: { doctor: Doctor; allDoctors?: Doctor[] }) {
  const candidates = allDoctors ?? []
  const similarity = (candidate: Doctor) => Number(candidate.specialty === doctor.specialty) * 2 + Number(candidate.practice.city === doctor.practice.city)
  const similarDoctors = candidates
    .filter(candidate => candidate._id !== doctor._id)
    .sort((a, b) => similarity(b) - similarity(a))
    .slice(0, 3)

  return (
    <aside aria-label="Doctor and clinic information" className="min-w-0 space-y-4 self-start">
      <section aria-labelledby="clinic-information-heading" className="rounded-xl bg-card p-5 shadow-card">
        <h2 id="clinic-information-heading" className="text-lg font-semibold">Clinic Information</h2>
        <div role="img" aria-label="Clinic image placeholder" className="mt-3 flex aspect-[5/2] items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Building2 aria-hidden="true" className="size-12" strokeWidth={1.2} />
        </div>
        <h3 className="mt-3 text-sm font-semibold">{doctor.practice.name}</h3>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span className="min-w-0 break-words">{doctor.practice.address}<span className="block">{doctor.practice.city}, Germany</span></span>
        </p>
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Phone aria-hidden="true" className="size-4 shrink-0" />
          <span>{doctor.practice.phone}<span className="block text-xs">Demo phone number</span></span>
        </p>
      </section>

      <section aria-labelledby="doctor-availability-heading" className="rounded-xl bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <h2 id="doctor-availability-heading" className="text-lg font-semibold">Availability</h2>
          <CalendarDays aria-hidden="true" className="size-5 text-primary" />
        </div>
        <p className={`mt-2 flex items-center gap-2 text-sm ${doctor.acceptingNewPatients ? 'text-success' : 'text-muted-foreground'}`}>
          <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full bg-current" />
          {doctor.acceptingNewPatients ? 'Accepting new patients' : 'Not accepting new patients'}
        </p>
        <dl className="mt-5 space-y-4 text-sm">
          <div className="flex items-start gap-3">
            <Stethoscope aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0"><dt className="text-muted-foreground">Consultation Type</dt><dd>{doctor.consultationTypes.join(' & ')}</dd></div>
          </div>
          <div className="flex items-start gap-3">
            <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0"><dt className="text-muted-foreground">Average Consultation Time</dt><dd>{doctor.consultationMinutes} minutes</dd></div>
          </div>
          <div className="flex items-start gap-3">
            <Languages aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
            <div className="min-w-0"><dt className="text-muted-foreground">Languages</dt><dd>{doctor.languages.join(', ')}</dd></div>
          </div>
        </dl>
      </section>

      <section aria-labelledby="similar-doctors-heading" className="rounded-xl bg-card p-5 shadow-card">
        <h2 id="similar-doctors-heading" className="text-lg font-semibold">Similar Doctors</h2>
        <ul className="mt-2 divide-y divide-border">
          {similarDoctors.map(candidate => (
            <li key={candidate._id}>
              <Link to={`/doctors/${candidate._id}`} className="flex min-w-0 items-center gap-3 rounded-lg py-3 hover:bg-accent/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
                {candidate.imageUrl ? <img src={candidate.imageUrl} alt="" className="size-14 shrink-0 rounded-lg object-cover" /> : <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><UserRound aria-hidden="true" className="size-7" strokeWidth={1.3} /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">Dr. {candidate.firstName} {candidate.lastName}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{candidate.professionalTitle}</span>
                  <span className="mt-1.5 flex flex-wrap items-center gap-1 text-xs"><Star aria-hidden="true" className="size-3.5 fill-primary text-primary" /><span className="font-semibold"><span className="sr-only">Rated </span>{candidate.rating.toFixed(1)}<span className="sr-only"> out of 5</span></span><span className="text-muted-foreground">({candidate.reviewCount} reviews)</span></span>
                </span>
                <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  )
}

