import { Schema, model, type Model, type Types } from 'mongoose'

export interface IDoctor {
  _id?: Types.ObjectId
  slug?: string
  firstName: string
  lastName: string
  specialty: string
  description?: string
  imageUrl?: string
  tags?: string[]
  languages?: string[]
  consultationTypes?: string[]
  ratingAverage?: number
  ratingCount?: number
  pricePerHour: number
  currency?: string
  yearsOfExperience?: number
  recoveredPatients?: number
  inCarePatients?: number
  clinic?: {
    name?: string
    streetAddress?: string
    city?: string
    postalCode?: string
    country?: string
    phone?: string
    imageUrl?: string
  }
  location?: {
    type: 'Point'
    coordinates: [number, number]
  }
  workingHours?: { dayOfWeek: number; startTime: string; endTime: string }[]
  timeZone?: string
  consultationDurationMinutes?: number
  acceptingNewPatients?: boolean
  isActive?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const doctorSchema = new Schema<IDoctor>(
  {
    slug: { type: String, unique: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    tags: { type: [String], default: [] },
    languages: { type: [String], default: [] },
    consultationTypes: { type: [String], default: [] },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    pricePerHour: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'EUR', enum: ['EUR', 'USD', 'GBP'] },
    yearsOfExperience: { type: Number, default: 0, min: 0 },
    recoveredPatients: { type: Number, default: 0, min: 0 },
    inCarePatients: { type: Number, default: 0, min: 0 },
    clinic: {
      name: { type: String, trim: true },
      streetAddress: { type: String, trim: true },
      city: { type: String, trim: true },
      postalCode: { type: String, trim: true },
      country: { type: String, trim: true },
      phone: { type: String, trim: true },
      imageUrl: { type: String, trim: true },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        validate: {
          validator: (v: number[]) => !v || v.length === 2,
          message: 'coordinates must be [longitude, latitude]',
        },
      },
    },
    workingHours: [
      {
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    timeZone: { type: String, default: 'Europe/Berlin' },
    consultationDurationMinutes: { type: Number, default: 30, min: 1 },
    acceptingNewPatients: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: 'doctors' }
)

doctorSchema.index({ location: '2dsphere' })

export const Doctor: Model<IDoctor> = model<IDoctor>('Doctor', doctorSchema)
export type DoctorDocument = IDoctor & { _id: Types.ObjectId }
export default Doctor
