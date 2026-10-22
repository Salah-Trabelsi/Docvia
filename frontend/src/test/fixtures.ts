import type { Doctor } from "@/features/doctors/types/doctor.types";
import type { PatientAppointment } from "@/api/appointments";

export const now = Date.parse("2030-01-14T08:00:00Z");
export const slot = {
  startAt: "2030-01-15T09:00:00Z",
  endAt: "2030-01-15T09:30:00Z",
};
export const doctor: Doctor = {
  _id: "test-doctor",
  slug: "test-doctor",
  mongoId: "aaaaaaaaaaaaaaaaaaaaaaaa",
  firstName: "Robin",
  lastName: "Example",
  specialty: "Cardiology",
  professionalTitle: "Test specialist",
  rating: 0,
  reviewCount: 0,
  yearsOfExperience: 1,
  city: "Test City",
  description: "Synthetic fixture",
  hourlyRate: 0,
  expertise: [],
  recoveredPatients: 0,
  inCarePatients: 0,
  acceptingNewPatients: true,
  consultationTypes: ["In-person"],
  consultationMinutes: 30,
  languages: ["English"],
  practice: {
    name: "Test Clinic",
    address: "Test Street",
    city: "Test City",
    phone: "",
    location: { type: "Point", coordinates: [0, 0] },
  },
};
export const appointment: PatientAppointment = {
  _id: "bbbbbbbbbbbbbbbbbbbbbbbb",
  doctorId: {
    _id: "aaaaaaaaaaaaaaaaaaaaaaaa",
    slug: doctor.slug,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    specialty: doctor.specialty,
  },
  startsAt: slot.startAt,
  endsAt: slot.endAt,
  status: "confirmed",
};
export const patient = {
  _id: "synthetic-patient",
  firstName: "Test",
  lastName: "Patient",
  email: "patient@example.test",
  role: "patient" as const,
};
