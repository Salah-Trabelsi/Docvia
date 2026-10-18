import { MapPin, Star, UserRound } from 'lucide-react'
import type { Doctor } from '../types/doctor.types'

export function DoctorProfileCard({ doctor }: { doctor: Doctor }) {
  return (
    <section aria-labelledby="doctor-name" className="rounded-xl bg-card p-5 shadow-card sm:p-6">
      <div className="grid min-w-0 gap-6 @min-[42rem]:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <div className="relative flex min-h-64 self-stretch items-center justify-center rounded-xl bg-muted text-muted-foreground @min-[42rem]:min-h-80">
          {doctor.imageUrl ? <img src={doctor.imageUrl} alt={`Dr. ${doctor.firstName} ${doctor.lastName}`} className="absolute inset-0 h-full w-full rounded-xl object-cover object-top" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} /> : <span role="img" aria-label="Doctor photo placeholder" className="absolute inset-0 flex items-center justify-center"><UserRound aria-hidden="true" className="size-24" strokeWidth={1} /></span>}
          <span className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center gap-1.5 rounded-lg bg-card px-2 py-1.5 text-sm text-card-foreground shadow-sm">
            <Star aria-hidden="true" className="size-4 shrink-0 fill-primary text-primary" /><strong><span className="sr-only">Rated </span>{doctor.rating.toFixed(1)}<span className="sr-only"> out of 5</span></strong><span className="text-xs text-muted-foreground">({doctor.reviewCount} reviews)</span>
          </span>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 id="doctor-name" className="text-2xl font-semibold sm:text-3xl">Dr. {doctor.firstName} {doctor.lastName}</h1>
              <p className="mt-1 text-muted-foreground">{doctor.professionalTitle}</p>
            </div>
            <p className="shrink-0 rounded-xl bg-accent/60 px-3 py-2 text-lg font-semibold">{new Intl.NumberFormat('en-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(doctor.hourlyRate)}<span className="text-sm font-normal"> / hour</span></p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">{doctor.yearsOfExperience}+ years of experience</span>
            <span className="flex items-center gap-1 text-muted-foreground"><MapPin aria-hidden="true" className="size-4" />{doctor.practice.city}</span>
          </div>
          <p className="mt-4 text-s leading-relaxed text-muted-foreground">{doctor.description}</p>
          <ul aria-label="Expertise" className="mt-4 flex flex-wrap gap-2">
            {doctor.expertise.map(expertise => <li key={expertise} className="rounded-full bg-accent px-3 py-1.5 text-xs text-brand-foreground">{expertise}</li>)}
          </ul>
          <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
            <div className="grid min-h-[100px] min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 rounded-xl bg-accent/60 p-2 @min-[24rem]:grid-cols-[2.75rem_minmax(0,1fr)] @min-[24rem]:gap-3 @min-[24rem]:p-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-white @min-[24rem]:size-11"><img src="/images/icons/flame.png" alt="" className="size-5 object-contain @min-[24rem]:size-6" /></span>
              <div className="min-w-0"><p className="text-xs leading-5 @min-[24rem]:text-sm">Recovered<br />Patients</p><p className="mt-1 text-2xl leading-7 font-bold">{doctor.recoveredPatients.toLocaleString('en-GB')}</p></div>
            </div>
            <div className="grid min-h-[100px] min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-start gap-2 rounded-xl bg-muted p-2 @min-[24rem]:grid-cols-[2.75rem_minmax(0,1fr)] @min-[24rem]:gap-3 @min-[24rem]:p-3">
              <span className="flex size-8 items-center justify-center rounded-full bg-white @min-[24rem]:size-11"><img src="/images/icons/heart-rate.png" alt="" className="size-5 object-contain @min-[24rem]:size-6" /></span>
              <div className="min-w-0"><p className="text-xs leading-5 @min-[24rem]:text-sm">In Care<br />Patients</p><p className="mt-1 text-2xl leading-7 font-bold">{doctor.inCarePatients.toLocaleString('en-GB')}</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

