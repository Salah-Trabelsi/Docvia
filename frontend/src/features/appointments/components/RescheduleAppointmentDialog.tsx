import { useState } from 'react'
import { addDays, addMilliseconds, format } from 'date-fns'
import { DayPicker, TZDate } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { bookingDay, bookingTimeZone, getDoctorTimeSlots, isSlotAvailable } from '@/features/doctors/utils/availability'
import { useAvailabilityClock } from '@/features/doctors/hooks/useAvailabilityClock'
import type { Appointment } from '../types/appointment.types'

interface Props {
  appointment: Appointment
  appointments: Appointment[]
  onSave: (startsAt: string, endsAt: string) => void
}

export function RescheduleAppointmentDialog({ appointment, appointments, onSave }: Props) {
  const now = useAvailabilityClock()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>()
  const today = bookingDay(now)
  const duration = Date.parse(appointment.endsAt) - Date.parse(appointment.startsAt)
  const startAt = (day: Date, value: string) => {
    const start = bookingDay(day)
    const [hour, minute] = value.split(':').map(Number)
    start.setHours(hour, minute, 0, 0)
    return start
  }
  const available = (day: Date, value: string, clock = now) => {
    const slot = getDoctorTimeSlots(appointment.doctor, day).find(slot => slot.time === value)
    if (!slot || !isSlotAvailable(appointment.doctor, day, slot, clock)) return false
    const start = startAt(day, value).getTime()
    return !appointments.some(other => other._id !== appointment._id && (other.status === 'confirmed' || other.status === 'pending') && start < Date.parse(other.endsAt) && start + duration > Date.parse(other.startsAt))
  }
  const valid = !!date && !!time && available(date, time) && startAt(date, time).getTime() !== Date.parse(appointment.startsAt)
  const save = () => {
    if (!date || !time || !available(date, time, Date.now())) return
    const start = startAt(date, time)
    onSave(start.toISOString(), addMilliseconds(start, duration).toISOString())
  }

  return (
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="pr-8">Reschedule appointment</DialogTitle>
        <DialogDescription>Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}. Choose a new date and time in Europe/Berlin. This changes the demo only.</DialogDescription>
      </DialogHeader>
      <DayPicker mode="single" timeZone={bookingTimeZone} today={today} selected={date} onSelect={value => { setDate(value); setTime(undefined) }} startMonth={today} endMonth={addDays(today, 365)} weekStartsOn={1} navLayout="around"
        disabled={day => !getDoctorTimeSlots(appointment.doctor, day).some(slot => available(day, slot.time))}
        classNames={{
          root: 'min-w-0', months: 'relative', month: 'w-full', month_caption: 'flex h-11 items-center justify-center px-11', caption_label: 'text-sm font-semibold',
          button_previous: 'absolute left-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30', button_next: 'absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30',
          chevron: 'size-4 fill-current', month_grid: 'mt-2 w-full table-fixed', weekday: 'text-xs font-normal text-muted-foreground', day: 'p-0.5 text-center',
          day_button: 'flex min-h-10 w-full items-center justify-center rounded-lg hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed',
          selected: '[&>button]:bg-primary [&>button]:text-primary-foreground', disabled: 'text-muted-foreground/40 [&>button]:hover:bg-transparent', today: '[&>button]:ring-1 [&>button]:ring-primary',
        }} />
      <div>
        <h3 className="text-sm font-semibold">{date ? format(new TZDate(date, bookingTimeZone), 'EEEE, d MMMM') : 'Choose a date'}</h3>
        {date && <div aria-label="Available appointment times" className="mt-3 grid grid-cols-3 gap-2">
          {getDoctorTimeSlots(appointment.doctor, date).map(slot => <Button key={slot.time} variant={time === slot.time ? 'default' : 'outline'} className="min-h-11" disabled={!available(date, slot.time)} aria-pressed={time === slot.time} onClick={() => setTime(slot.time)}>{slot.time}</Button>)}
        </div>}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" className="min-h-11" />}>Keep appointment</DialogClose>
        <Button disabled={!valid} onClick={save} className="min-h-11">Update demo appointment</Button>
      </DialogFooter>
    </DialogContent>
  )
}

