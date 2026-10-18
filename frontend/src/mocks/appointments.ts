import type { Appointment } from '@/features/appointments/types/appointment.types'
import { doctors } from './doctors'

// Rolling fictional appointments keep the demo useful without backend data.
const demoSchedule = [
  { doctorId: 'ethan-roberts', days: 2, hour: 10, minute: 30, status: 'confirmed' },
  { doctorId: 'laura-schmidt', days: 8, hour: 14, minute: 0, status: 'confirmed' },
  { doctorId: 'michael-braun', days: 15, hour: 9, minute: 0, status: 'confirmed' },
  { doctorId: 'laura-schmidt', days: -4, hour: 11, minute: 0, status: 'completed' },
  { doctorId: 'michael-braun', days: -12, hour: 9, minute: 30, status: 'completed' },
  { doctorId: 'sarah-ahmed', days: -18, hour: 15, minute: 0, status: 'cancelled' },
] as const

export const appointments: Appointment[] = demoSchedule.map((entry, index) => {
  const doctor = doctors.find(doctor => doctor._id === entry.doctorId)
  if (!doctor) throw new Error(`Missing demo doctor: ${entry.doctorId}`)
  const start = new Date()
  start.setDate(start.getDate() + entry.days)
  start.setHours(entry.hour, entry.minute, 0, 0)

  return {
    _id: `demo-appointment-${index + 1}`,
    doctor,
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + 30 * 60_000).toISOString(),
    status: entry.status,
  }
})

