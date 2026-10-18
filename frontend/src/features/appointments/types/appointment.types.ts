import type { Doctor } from '@/features/doctors/types/doctor.types'

export interface Appointment {
  _id: string
  doctor: Doctor
  startsAt: string
  endsAt: string
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed'
}

