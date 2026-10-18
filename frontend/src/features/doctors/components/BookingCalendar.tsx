import { useState } from 'react'
import { DayPicker, TZDate } from 'react-day-picker'
import { addDays, format } from 'date-fns'
import { Button } from '@/components/ui/button'
import type { Doctor } from '../types/doctor.types'
import { bookingDay, bookingTimeZone as timeZone, getDoctorTimeSlots, hasAvailableSlots, isSlotAvailable } from '../utils/availability'
import { useAvailabilityClock } from '../hooks/useAvailabilityClock'

export function BookingCalendar({ doctor }: { doctor: Doctor }) {
  const now = useAvailabilityClock()
  const [date, setDate] = useState<Date>()
  const [time, setTime] = useState<string>()
  const today = bookingDay(now)
  const lastDate = addDays(today, 365)
  const dateUnavailable = (value: Date) => !hasAvailableSlots(doctor, value, now)
  const doctorTimeSlots = date ? getDoctorTimeSlots(doctor, date) : []
  const validSelection = !!date && doctorTimeSlots.some(slot => slot.time === time && isSlotAvailable(doctor, date, slot, now))

  return (
    <section aria-labelledby="booking-heading" className="rounded-xl bg-card p-5 shadow-card sm:p-8">
      <h2 id="booking-heading" className="text-xl font-semibold">Select date and time</h2>
      <p className="mt-1 text-sm text-muted-foreground">All appointment times are in Europe/Berlin.</p>
      <div className="mt-5 grid min-w-0 gap-6 @min-[42rem]:grid-cols-2">
        <DayPicker
          mode="single"
          timeZone={timeZone}
          today={today}
          selected={date}
          onSelect={value => { setDate(value); setTime(undefined) }}
          disabled={dateUnavailable}
          startMonth={today}
          endMonth={lastDate}
          weekStartsOn={1}
          navLayout="around"
          classNames={{
            root: 'min-w-0', months: 'relative', month: 'w-full',
            month_caption: 'flex h-11 items-center justify-center px-11', caption_label: 'text-sm font-semibold',
            button_previous: 'absolute left-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30',
            button_next: 'absolute right-0 top-0 flex size-11 items-center justify-center rounded-lg hover:bg-accent disabled:opacity-30',
            chevron: 'size-4 fill-current', month_grid: 'mt-3 w-full table-fixed border-collapse',
            weekday: 'pb-2 text-center text-xs font-normal text-muted-foreground', day: 'p-0.5 text-center',
            day_button: 'flex min-h-10 w-full items-center justify-center rounded-lg text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed',
            selected: '[&>button]:bg-primary [&>button]:font-semibold [&>button]:text-primary-foreground',
            disabled: 'text-muted-foreground/40 [&>button]:hover:bg-transparent', today: '[&>button]:ring-1 [&>button]:ring-primary',
          }}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">Available times</h3>
          <p className="mt-1 text-sm text-muted-foreground">{date ? format(new TZDate(date, timeZone), 'EEEE, d MMMM yyyy') : 'Choose a date to see available times.'}</p>
          {date && (
            <div aria-label="Appointment time" className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {doctorTimeSlots.map(slot => {
                const unavailable = !isSlotAvailable(doctor, date, slot, now)
                return <Button key={slot.time} variant={time === slot.time && !unavailable ? 'default' : 'outline'} className="min-h-11" disabled={unavailable} aria-pressed={time === slot.time && !unavailable} onClick={() => setTime(slot.time)}>{slot.time}</Button>
              })}
            </div>
          )}
          <p role="status" className="mt-4 text-sm text-muted-foreground">{validSelection && date ? `Selected: ${format(new TZDate(date, timeZone), 'd MMM yyyy')} at ${time} (Europe/Berlin).` : 'Select an available date and time.'}</p>
        </div>
      </div>
      <div className="mt-6 border-t pt-5">
        <Button className="min-h-11 w-full sm:w-auto sm:px-6" disabled={!validSelection} aria-describedby="booking-demo-note">Book Appointment</Button>
        <p id="booking-demo-note" className="mt-2 text-xs text-muted-foreground">Demo availability only. Booking is not available yet.</p>
      </div>
    </section>
  )
}

