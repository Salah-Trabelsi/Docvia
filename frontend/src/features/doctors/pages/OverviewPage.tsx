import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NeedHelpCard } from "@/components/shared/NeedHelpCard";
import { UpcomingAppointments } from "@/features/appointments/components/UpcomingAppointments";
import { AppointmentManagementCard } from "@/features/appointments/components/AppointmentManagementCard";
import { useLocationStore } from "@/stores/locationStore";
import { getDoctors } from "@/api/doctors";
import { mapApiDoctor } from "../utils/mapDoctor";
import { DoctorsMap } from "../components/DoctorsMap";
import { PopularDoctors } from "../components/PopularDoctors";
import { SpecialtyFilters } from "../components/SpecialtyFilters";
import { WelcomeBanner } from "../components/WelcomeBanner";
import type { SpecialtyFilter } from "../types/doctor.types";
import { filterDoctors } from "../utils/filterDoctors";

// Stable membership only: preserve the API's existing display order.
const popularDoctorSlugs = new Set([
  "ethan-roberts",
  "daniel-wilson",
  "michael-braun",
  "olivia-martinez",
  "laura-schmidt",
  "maria-lucia",
]);

export function OverviewPage() {
  const selectedCity = useLocationStore((state) => state.selectedCity);
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyFilter>("All Specialties");
  const {
    data: apiDoctors,
    isLoading,
    isError,
  } = useQuery({
    queryKey: doctorKeys.mappedList,
    queryFn: () => getDoctors().then((doctors) => doctors.map(mapApiDoctor)),
  });

  if (isLoading) {
    return (
      <div className="@container min-w-0 space-y-3">
        <h1 className="text-2xl font-semibold">Loading doctors…</h1>
      </div>
    );
  }
  if (isError || !apiDoctors) {
    return (
      <div className="@container min-w-0 space-y-3">
        <h1 className="text-2xl font-semibold">Unable to load doctors</h1>
        <p className="text-muted-foreground">Please refresh and try again.</p>
      </div>
    );
  }

  const filteredDoctors = filterDoctors(
    apiDoctors,
    selectedCity,
    selectedSpecialty,
  );
  const popularDoctors = filteredDoctors.filter((doctor) =>
    popularDoctorSlugs.has(doctor.slug ?? doctor._id),
  );

  return (
    <div className="@container min-w-0">
      <div className="grid min-w-0 grid-cols-1 gap-6 @min-[70rem]:grid-cols-[minmax(0,7fr)_minmax(20rem,3fr)]">
        <div className="@container min-w-0 space-y-3">
          <WelcomeBanner />
          <SpecialtyFilters
            selected={selectedSpecialty}
            onSelect={setSelectedSpecialty}
          />
          <PopularDoctors
            doctors={popularDoctors}
            selectedCity={selectedCity}
            selectedSpecialty={selectedSpecialty}
            onResetSpecialty={() => setSelectedSpecialty("All Specialties")}
          />
          <UpcomingAppointments />
        </div>
        <div className="flex min-w-0 flex-col gap-4 [&>*]:shrink-0">
          <DoctorsMap doctors={filteredDoctors} />
          <AppointmentManagementCard />
          <NeedHelpCard className="@min-[70rem]:flex-1" />
        </div>
      </div>
    </div>
  );
}
