import { useState } from 'react'
import { format, differenceInCalendarDays } from 'date-fns'
import { TZDate } from 'react-day-picker'
import { Building2, CalendarDays, ChevronRight, Clock3, MapPin, Star, UserRound, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { bookingTimeZone } from '@/features/doctors/utils/availability'
import { AppointmentDetailsDialog } from './AppointmentDetailsDialog'
import { RescheduleAppointmentDialog } from './RescheduleAppointmentDialog'
import type { Appointment } from '../types/appointment.types'

interface Props {
  appointment: Appointment
  appointments: Appointment[]
  now: number
  onUpdate: (appointment: Appointment) => void
}

export function AppointmentListCard({ appointment, appointments, now, onUpdate }: Props) {
  const [open, setOpen] = useState(false)
  const [action, setAction] = useState<'details' | 'cancel' | 'reschedule'>('details')
  const { doctor } = appointment
  const start = new TZDate(appointment.startsAt, bookingTimeZone)
  const end = new TZDate(appointment.endsAt, bookingTimeZone)
  const upcoming = (appointment.status === 'confirmed' || appointment.status === 'pending') && start.getTime() > now
  const days = differenceInCalendarDays(start, new TZDate(now, bookingTimeZone))
  const badge = upcoming ? (days === 0 ? 'Today' : `In ${days} ${days === 1 ? 'day' : 'days'}`) : appointment.status
  const update = (next: Appointment) => { setOpen(false); onUpdate(next) }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <article className="relative grid min-w-0 gap-4 rounded-xl bg-card p-4 shadow-card @min-[56rem]:grid-cols-[5rem_minmax(0,1fr)_20rem]">
        <DialogTrigger onClick={() => setAction('details')} className="absolute inset-0 z-10 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring" aria-label={`View appointment details for Dr. ${doctor.firstName} ${doctor.lastName}, ${format(start, 'd MMMM yyyy')}`} />
        <div className="flex w-fit min-w-20 flex-col items-center justify-center rounded-xl bg-accent/60 px-3 py-2 text-brand-foreground @min-[56rem]:w-full">
          <span className="text-3xl font-semibold">{format(start, 'dd')}</span><span className="text-xs">{format(start, 'MMM yyyy')}</span><span className="mt-0.5 text-xs">{format(start, 'EEE')}</span>
        </div>
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground"><UserRound aria-hidden="true" className="size-9" strokeWidth={1.2} /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="text-sm font-semibold">Dr. {doctor.firstName} {doctor.lastName}</h3><p className="mt-1 text-sm text-muted-foreground">{doctor.professionalTitle}</p></div>
              <span className={`rounded-full px-3 py-1 text-xs capitalize ${upcoming ? 'bg-sky-100 text-sky-700' : appointment.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-destructive/10 text-destructive'}`} title={appointment.status}>{badge}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <p className="flex items-center gap-1"><Star aria-hidden="true" className="size-4 fill-primary text-primary" /><strong className="text-foreground">{doctor.rating.toFixed(1)}</strong> ({doctor.reviewCount} reviews)</p>
              <p className="flex items-center gap-1.5"><Building2 aria-hidden="true" className="size-4 shrink-0" />{doctor.practice.name}</p>
              <p className="flex items-center gap-1.5"><MapPin aria-hidden="true" className="size-4 shrink-0" />{doctor.practice.city}</p>
            </div>
          </div>
        </div>
        <div className="min-w-0 rounded-lg bg-background/70 p-3">
          <div className="flex items-center gap-3"><Clock3 aria-hidden="true" className="size-5 shrink-0" /><div className="flex-1"><p className="text-sm font-medium">{format(start, 'HH:mm')} – {format(end, 'HH:mm')}</p><p className="text-xs text-muted-foreground">Consultation · Europe/Berlin</p></div><ChevronRight aria-hidden="true" className="size-4" /></div>
          <div className="relative z-20 mt-3 flex flex-wrap gap-2">
            {upcoming ? <>
              <DialogTrigger onClick={() => setAction('reschedule')} render={<Button variant="outline" className="min-h-11 flex-1 bg-card" />}><CalendarDays aria-hidden="true" />Reschedule</DialogTrigger>
              <DialogTrigger onClick={() => setAction('cancel')} render={<Button variant="destructive" className="min-h-11 flex-1" />}><X aria-hidden="true" />Cancel</DialogTrigger>
            </> : <DialogTrigger onClick={() => setAction('details')} render={<Button variant="outline" className="min-h-11 bg-card" />}>View Details</DialogTrigger>}
          </div>
        </div>
      </article>
      {action === 'details' && <AppointmentDetailsDialog appointment={appointment} />}
      {action === 'reschedule' && <RescheduleAppointmentDialog key={`${appointment._id}-${open}`} appointment={appointment} appointments={appointments} onSave={(startsAt, endsAt) => update({ ...appointment, startsAt, endsAt })} />}
      {action === 'cancel' && <DialogContent>
        <DialogHeader><DialogTitle className="pr-8">Cancel this demo appointment?</DialogTitle><DialogDescription>Your consultation with Dr. {doctor.firstName} {doctor.lastName} on {format(start, 'd MMMM yyyy')} at {format(start, 'HH:mm')} will move to Cancelled on this page only. No real appointment will be cancelled.</DialogDescription></DialogHeader>
        <DialogFooter><DialogClose render={<Button variant="outline" className="min-h-11" />}>Keep appointment</DialogClose><Button variant="destructive" className="min-h-11" onClick={() => update({ ...appointment, status: 'cancelled' })}>Cancel demo appointment</Button></DialogFooter>
      </DialogContent>}
    </Dialog>
  )
}

