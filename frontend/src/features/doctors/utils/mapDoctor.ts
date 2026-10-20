import type { Doctor } from "../types/doctor.types";
import type { ApiDoctor } from "../types/apiDoctor.types";

export function mapApiDoctor(api: ApiDoctor): Doctor {
  const slug = api.slug ?? api._id;
  return {
    _id: String(slug),
    mongoId: String(api._id),
    slug: api.slug,
    firstName: api.firstName,
    lastName: api.lastName,
    specialty: api.specialty,
    professionalTitle: `${api.specialty} Specialist`,
    imageUrl: api.imageUrl,
    rating: api.ratingAverage ?? 0,
    reviewCount: api.ratingCount ?? 0,
    yearsOfExperience: api.yearsOfExperience ?? 0,
    city: api.clinic?.city ?? "",
    description: api.description ?? "",
    hourlyRate: api.pricePerHour ?? 0,
    expertise: api.tags ?? [],
    recoveredPatients: api.recoveredPatients ?? 0,
    inCarePatients: api.inCarePatients ?? 0,
    acceptingNewPatients: api.acceptingNewPatients ?? true,
    consultationTypes: api.consultationTypes ?? [],
    consultationMinutes: api.consultationDurationMinutes ?? 30,
    languages: api.languages ?? [],
    practice: {
      name: api.clinic?.name ?? "",
      address: api.clinic?.streetAddress ?? "",
      city: api.clinic?.city ?? "",
      country: api.clinic?.country,
      phone: api.clinic?.phone ?? "",
      imageUrl: api.clinic?.imageUrl,
      location: api.location ?? { type: "Point", coordinates: [0, 0] },
    },
  };
}
