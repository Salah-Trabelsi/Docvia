export type Specialty =
  | "Cardiology"
  | "Dermatology"
  | "Neurology"
  | "Pediatrics"
  | "Orthopedics"
  | "Gynecology"
  | "ENT"
  | "General Medicine"
  | "Ophthalmology"
  | "Psychiatry";

export type SpecialtyFilter = "All Specialties" | Specialty;

export interface Doctor {
  _id: string;
  mongoId?: string;
  slug?: string;
  firstName: string;
  lastName: string;
  specialty: string;
  professionalTitle: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
  city: string;
  description: string;
  hourlyRate: number;
  expertise: string[];
  recoveredPatients: number;
  inCarePatients: number;
  acceptingNewPatients: boolean;
  consultationTypes: string[];
  consultationMinutes: number;
  languages: string[];
  practice: {
    name: string;
    address: string;
    city: string;
    country?: string;
    phone: string;
    imageUrl?: string;
    location: {
      type: "Point";
      coordinates: [number, number];
    };
  };
}
