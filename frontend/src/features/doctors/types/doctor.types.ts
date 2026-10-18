export type Specialty =
  | 'Cardiology'
  | 'Dermatology'
  | 'Neurology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'Gynecology'
  | 'Ophthalmology'
  | 'Psychiatry'

export type SpecialtyFilter = 'All Specialties' | Specialty

export interface Doctor {
  _id: string
  firstName: string
  lastName: string
  specialty: Specialty
  professionalTitle: string
  imageUrl?: string
  rating: number
  reviewCount: number
  yearsOfExperience: number
  city: string
  availability: 'today' | 'tomorrow'
  description: string
  hourlyRate: number
  expertise: string[]
  recoveredPatients: number
  inCarePatients: number
  acceptingNewPatients: boolean
  consultationTypes: string[]
  consultationMinutes: number
  languages: string[]
  workingHours?: { dayOfWeek: number; startTime: string; endTime: string }[]
  practice: {
    name: string
    address: string
    city: string
    phone: string
    location: {
      type: 'Point'
      coordinates: [number, number] // longitude, latitude
    }
  }
}

