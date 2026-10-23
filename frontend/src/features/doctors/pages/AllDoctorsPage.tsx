import { useState } from "react";
import { useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { getDoctors } from "@/api/doctors";
import { Button } from "@/components/ui/button";
import { NeedHelpCard } from "@/components/shared/NeedHelpCard";
import { useLocationStore } from "@/stores/locationStore";
import { DoctorGrid } from "../components/DoctorGrid";
import { DoctorsMap } from "../components/DoctorsMap";
import { SpecialtyFilters } from "../components/SpecialtyFilters";
import { doctorKeys } from "../queries/doctorKeys";
import type { Doctor, SpecialtyFilter } from "../types/doctor.types";
import { filterDoctors } from "../utils/filterDoctors";
import { mapApiDoctor } from "../utils/mapDoctor";

const pageSize = 12;

// The filter key remounts only the results, resetting pagination synchronously.
function DoctorResults({ doctors }: { doctors: Doctor[] }) {
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleDoctors = doctors.slice(0, visibleCount);

  return (
    <section aria-label="Matching doctors" className="space-y-3">
      {doctors.length > 0 ? (
        <DoctorGrid doctors={visibleDoctors} />
      ) : (
        <div className="rounded-xl bg-card px-6 py-10 text-center shadow-card">
          <h2 className="text-base">No matching doctors</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Try another name, specialty or location.
          </p>
        </div>
      )}
      {visibleCount < doctors.length && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            className="min-h-11"
            onClick={() => setVisibleCount((count) => count + pageSize)}
          >
            View More
          </Button>
        </div>
      )}
    </section>
  );
}

export function AllDoctorsPage() {
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const [searchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilter>("All Specialties");
  const doctors = useQuery({
    queryKey: doctorKeys.mappedList,
    queryFn: () => getDoctors().then((data) => data.map(mapApiDoctor)),
  });
  const matchingDoctors = filterDoctors(
    doctors.data ?? [],
    selectedCity,
    selectedSpecialty,
    search,
  );

  return (
    <div className="@container min-w-0 space-y-4">
      <h1 className="text-2xl font-semibold">All Doctors</h1>
      <SpecialtyFilters
        selected={selectedSpecialty}
        onSelect={setSelectedSpecialty}
      />
      {doctors.isPending ? (
        <p role="status">Loading doctors…</p>
      ) : doctors.isError ? (
        <div role="alert" className="space-y-3">
          <p>Unable to load doctors. Please try again.</p>
          <Button
            variant="outline"
            disabled={doctors.isFetching}
            onClick={() => void doctors.refetch()}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 items-start gap-6 @min-[70rem]:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)]">
          <div className="@container min-w-0">
            <DoctorResults
              key={JSON.stringify([search, selectedSpecialty, selectedCity])}
              doctors={matchingDoctors}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-4 [&>*]:shrink-0">
            <DoctorsMap doctors={matchingDoctors} />
            <NeedHelpCard />
          </div>
        </div>
      )}
    </div>
  );
}
