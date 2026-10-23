import type { Doctor, SpecialtyFilter } from "../types/doctor.types";
import type { LocationSelection } from "@/stores/locationStore";

export function matchesDoctorName(
  doctor: { firstName: string; lastName: string },
  search: string,
) {
  const query = search.trim().replace(/\s+/g, " ").toLowerCase();
  return `${doctor.firstName} ${doctor.lastName}`.toLowerCase().includes(query);
}

export function filterDoctors(
  doctors: Doctor[],
  city: LocationSelection,
  specialty: SpecialtyFilter,
  search = "",
) {
  return doctors.filter(
    (doctor) =>
      (city === "All locations" || doctor.practice.city === city) &&
      (specialty === "All Specialties" || doctor.specialty === specialty) &&
      matchesDoctorName(doctor, search),
  );
}
