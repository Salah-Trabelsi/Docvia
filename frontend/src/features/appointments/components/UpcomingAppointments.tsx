import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, ChevronRight, Clock3, MapPin, UserRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { Appointment } from '../types/appointment.types'

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', weekday: 'short', timeZone: 'Europe/Berlin' })
const timeFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' })
const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', timeZone: 'Europe/Berlin' })
const monthFormat = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'Europe/Berlin' })
const calendarFormat = new Intl.DateTimeFormat('en-GB', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone: 'Europe/Berlin' })

// Compare Berlin calendar dates, not elapsed hours (including daylight-saving changes).
function calendarDay(date: Date | number) {
  const parts = calendarFormat.formatToParts(date)
  const value = (type: string) => Number(parts.find(part => part.type === type)?.value)
  return Date.UTC(value('year'), value('month') - 1, value('day')) / 86_400_000
}

export function UpcomingAppointments({ appointments }: { appointments: Appointment[] }) {
  const [now, setNow] = useState(() => Date.now())
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
  const upcoming = appointments
    .filter(appointment => appointment.status === 'confirmed' && Date.parse(appointment.startsAt) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .slice(0, 3)

  return (
    <section aria-labelledby="upcoming-appointments-heading">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="upcoming-appointments-heading" className="text-lg font-semibold">Upcoming Appointments</h2>
        <Link to="/appointments" className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-2 text-sm text-brand-foreground hover:bg-accent">
          View all <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <div className="rounded-xl bg-card px-6 py-8 text-center shadow-card">
          <CalendarDays aria-hidden="true" className="mx-auto mb-3 size-7 text-muted-foreground" />
          <h3 className="text-base font-medium">No upcoming appointments</h3>
          <p className="mt-2 text-sm text-muted-foreground">Your next appointment will appear here once you book a visit.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl bg-card shadow-card">
          {upcoming.map(appointment => {
            const { doctor } = appointment
            const start = new Date(appointment.startsAt)
            const daysUntil = calendarDay(start) - calendarDay(now)
            const countdown = daysUntil === 0 ? 'Today' : `In ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}`
            const name = `Dr. ${doctor.firstName} ${doctor.lastName}`
            const time = `${timeFormat.format(start)} – ${timeFormat.format(new Date(appointment.endsAt))}`
            return (
              <li key={appointment._id} className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-center gap-3 p-4 @min-[48rem]:grid-cols-[3rem_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
                <div aria-hidden="true" className="rounded-lg bg-accent py-1.5 text-center text-brand-foreground">
                  <span className="block text-xl font-semibold leading-tight">{dayFormat.format(start)}</span>
                  <span className="block text-xs font-medium">{monthFormat.format(start)}</span>
                </div>
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted text-muted-foreground">
                    {!imageFailed && doctor.imageUrl ? (
                      <img
                        src={doctor.imageUrl}
                        alt={name}
                        className="size-full object-cover"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <UserRound aria-hidden="true" className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0"><p className="text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">{doctor.professionalTitle}</p></div>
                </div>
                <div className="col-span-2 space-y-1 text-xs text-muted-foreground @min-[48rem]:col-span-1">
                  <p className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="size-3.5 shrink-0" /><time dateTime={appointment.startsAt}>{dateFormat.format(start)}</time></p>
                  <p className="flex items-center gap-2"><Clock3 aria-hidden="true" className="size-3.5 shrink-0" />{time}</p>
                </div>
                <p className="col-span-2 flex min-w-0 items-start gap-2 text-xs text-muted-foreground @min-[48rem]:col-span-1">
                  <MapPin aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className="min-w-0 break-words">{doctor.practice.name}<span className="block">{doctor.practice.city}</span></span>
                </p>
                <div className="col-span-2 @min-[48rem]:col-span-1">
                  <span className="inline-block whitespace-nowrap rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">{countdown}</span>
                </div>
                <Dialog>
                  <DialogTrigger render={<Button variant="outline" className="col-span-2 min-h-11 bg-white text-black hover:bg-white hover:text-black @min-[48rem]:col-span-1" />} aria-label={`View details for appointment with ${name}`}>
                    View Details
                  </DialogTrigger>
                  <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="pr-8">Appointment details</DialogTitle>
                      <DialogDescription>{name} &middot; {doctor.professionalTitle}</DialogDescription>
                    </DialogHeader>
                    <dl className="space-y-4">
                      <div><dt className="text-xs text-muted-foreground">Date</dt><dd><time dateTime={appointment.startsAt}>{dateFormat.format(start)}</time></dd></div>
                      <div><dt className="text-xs text-muted-foreground">Time (Europe/Berlin)</dt><dd>{time}</dd></div>
                      <div><dt className="text-xs text-muted-foreground">Status</dt><dd>{appointment.status === 'confirmed' ? 'Confirmed' : 'Pending'}</dd></div>
                      <div><dt className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin aria-hidden="true" className="size-3.5" />Practice</dt><dd>{doctor.practice.name}, {doctor.practice.city}<span className="mt-1 block text-xs text-muted-foreground">{doctor.practice.address}</span></dd></div>
                    </dl>
                  </DialogContent>
                </Dialog>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

