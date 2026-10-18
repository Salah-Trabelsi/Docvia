import type { Doctor, Specialty } from '../types/doctor.types'

export function mapApiDoctor(api: ApiDoctor): Doctor {
  const slug = api.slug ?? api._id
  return {
    _id: String(slug),
    firstName: api.firstName,
    lastName: api.lastName,
    specialty: api.specialty as Specialty,
    professionalTitle: `${api.specialty} Specialist`,
    imageUrl: api.imageUrl,
    rating: api.ratingAverage ?? 0,
    reviewCount: api.ratingCount ?? 0,
    yearsOfExperience: api.yearsOfExperience ?? 0,
    city: api.clinic?.city ?? '',
    availability: 'tomorrow',
    description: api.description ?? '',
    hourlyRate: api.pricePerHour ?? 0,
    expertise: api.tags ?? [],
    recoveredPatients: api.recoveredPatients ?? 0,
    inCarePatients: api.inCarePatients ?? 0,
    acceptingNewPatients: api.acceptingNewPatients ?? true,
    consultationTypes: api.consultationTypes ?? [],
    consultationMinutes: api.consultationDurationMinutes ?? 30,
    languages: api.languages ?? [],
    workingHours: api.workingHours ?? [],
    practice: {
      name: api.clinic?.name ?? '',
      address: api.clinic?.streetAddress ?? '',
      city: api.clinic?.city ?? '',
      phone: api.clinic?.phone ?? '',
      location: api.location ?? { type: 'Point', coordinates: [0, 0] },
    },
  }
}


export interface ApiDoctor {
  _id: string
  slug: string
  firstName: string
  lastName: string
  specialty: string
  description?: string
  imageUrl?: string
  ratingAverage?: number
  ratingCount?: number
  pricePerHour: number
  yearsOfExperience?: number
  tags?: string[]
  languages?: string[]
  consultationTypes?: string[]
  recoveredPatients?: number
  inCarePatients?: number
  acceptingNewPatients?: boolean
  consultationDurationMinutes?: number
  workingHours?: {
    dayOfWeek: number
    startTime: string
    endTime: string
  }[]
  clinic?: {
    name?: string
    streetAddress?: string
    city?: string
    phone?: string
  }
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
}