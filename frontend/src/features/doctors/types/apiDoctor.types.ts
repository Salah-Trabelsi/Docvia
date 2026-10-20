export interface DoctorClinic {
  name?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  imageUrl?: string;
}

export interface ApiDoctor {
  _id: string;
  slug: string;
  firstName: string;
  lastName: string;
  specialty: string;
  description?: string;
  imageUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  pricePerHour: number;
  yearsOfExperience?: number;
  tags?: string[];
  languages?: string[];
  consultationTypes?: string[];
  recoveredPatients?: number;
  inCarePatients?: number;
  acceptingNewPatients?: boolean;
  consultationDurationMinutes?: number;
  workingHours?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  clinic?: DoctorClinic;
  location?: {
    type: "Point";
    coordinates: [number, number];
  };
}
