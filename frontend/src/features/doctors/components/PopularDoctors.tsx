import { Search, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { Doctor, SpecialtyFilter } from "../types/doctor.types";
import { DoctorGrid } from "./DoctorGrid";
import type { LocationSelection } from "@/stores/locationStore";

interface PopularDoctorsProps {
  doctors: Doctor[];
  selectedSpecialty: SpecialtyFilter;
  selectedCity: LocationSelection;
  onResetSpecialty: () => void;
}

export function PopularDoctors({
  doctors,
  selectedSpecialty,
  selectedCity,
  onResetSpecialty,
}: PopularDoctorsProps) {
  const locationDescription =
    selectedCity === "All locations"
      ? "across all locations"
      : `in ${selectedCity}`;

  return (
    <section aria-labelledby="popular-doctors-heading">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 id="popular-doctors-heading" className="text-lg font-semibold">
          Popular Doctors
        </h2>
        <Link
          to="/doctors"
          className="flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-brand-foreground hover:bg-accent"
        >
          View All <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
      <p role="status" className="sr-only">
        {doctors.length} doctors shown {locationDescription} for{" "}
        {selectedSpecialty}.
      </p>
      {doctors.length > 0 ? (
        <DoctorGrid doctors={doctors} />
      ) : (
        <div className="rounded-xl bg-card px-6 py-10 text-center shadow-card">
          <Search
            aria-hidden="true"
            className="mx-auto mb-3 size-7 text-muted-foreground"
          />
          <h3 className="text-base">
            No matching doctors {locationDescription}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another specialty or choose a different city in the Header.
          </p>
          {selectedSpecialty !== "All Specialties" && (
            <button
              type="button"
              onClick={onResetSpecialty}
              className="mt-4 min-h-11 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/80"
            >
              Show all specialties {locationDescription}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
