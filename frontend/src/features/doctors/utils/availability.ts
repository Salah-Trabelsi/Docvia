import { addDays, format, startOfDay } from 'date-fns'
import { TZDate } from 'react-day-picker'
import type { Doctor } from '../types/doctor.types'

export const bookingTimeZone = 'Europe/Berlin'

export function bookingDay(value: Date | number) {
  return startOfDay(new TZDate(value, bookingTimeZone))
}

function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function getDoctorTimeSlots(doctor: Doctor, date: Date): { time: string; available: boolean }[] {
  const day = bookingDay(date)
  const weekday = day.getDay()
  const slots: { time: string; available: boolean }[] = []
  for (const wh of doctor.workingHours ?? []) {
    if (wh.dayOfWeek !== weekday) continue
    const duration = doctor.consultationMinutes || 30
    let cursor = toMinutes(wh.startTime)
    const end = toMinutes(wh.endTime)
    while (cursor + duration <= end) {
      const h = Math.floor(cursor / 60).toString().padStart(2, '0')
      const m = (cursor % 60).toString().padStart(2, '0')
      slots.push({ time: `${h}:${m}`, available: true })
      cursor += duration
    }
  }
  return slots
}

function slotDate(date: Date, time: string) {
  const day = bookingDay(date)
  const [hour, minute] = time.split(':').map(Number)
  return new TZDate(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, bookingTimeZone)
}

export function isSlotAvailable(doctor: Doctor, date: Date, slot: DemoTimeSlot, now: number) {
  const today = bookingDay(now)
  const day = bookingDay(date)
  return day >= today && day <= addDays(today, 365)
    && getDoctorTimeSlots(doctor, day).some(scheduled => scheduled.time === slot.time && scheduled.available)
    && slot.available && slotDate(day, slot.time).getTime() > now
}

export function hasAvailableSlots(doctor: Doctor, date: Date, now: number) {
  return getDoctorTimeSlots(doctor, date).some(slot => isSlotAvailable(doctor, date, slot, now))
}

export function getAvailabilityLabel(doctor: Doctor, now: number) {
  const today = bookingDay(now)
  for (let offset = 0; offset <= 365; offset++) {
    const day = addDays(today, offset)
    if (hasAvailableSlots(doctor, day, now)) {
      return {
        availableToday: offset === 0,
        label: offset === 0 ? 'Available Today' : offset === 1 ? 'Available Tomorrow' : `Available ${format(day, 'EEE, d MMM')}`,
      }
    }
  }
  return { availableToday: false, label: 'No available appointments' }
}

