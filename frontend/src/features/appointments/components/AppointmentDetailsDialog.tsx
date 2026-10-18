import { MapPin } from 'lucide-react'
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { Appointment } from '../types/appointment.types'

export function AppointmentDetailsDialog({ appointment }: { appointment: Appointment }) {
  const date = new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeZone: 'Europe/Berlin' })
  const time = new Intl.DateTimeFormat('en-GB', { timeStyle: 'short', timeZone: 'Europe/Berlin' })
  const { doctor } = appointment
  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="pr-8">Appointment details</DialogTitle>
        <DialogDescription>Dr. {doctor.firstName} {doctor.lastName} &middot; {doctor.professionalTitle}</DialogDescription>
      </DialogHeader>
      <dl className="space-y-4">
        <div><dt className="text-xs text-muted-foreground">Date</dt><dd><time dateTime={appointment.startsAt}>{date.format(new Date(appointment.startsAt))}</time></dd></div>
        <div><dt className="text-xs text-muted-foreground">Time (Europe/Berlin)</dt><dd>{time.format(new Date(appointment.startsAt))} – {time.format(new Date(appointment.endsAt))}</dd></div>
        <div><dt className="text-xs text-muted-foreground">Status</dt><dd className="capitalize">{appointment.status}</dd></div>
        <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin aria-hidden="true" className="size-3.5" />Practice</dt><dd>{doctor.practice.name}, {doctor.practice.city}<span className="mt-1 block text-xs text-muted-foreground">{doctor.practice.address}</span></dd></div>
      </dl>
      <p className="text-xs text-muted-foreground">Demo appointment. Changes are local to this page and are not saved to a booking service.</p>
    </DialogContent>
  )
}

