import { useQuery } from "@tanstack/react-query";
import {
  doctorAvailabilitySummaryKey,
  getDoctorAvailabilitySummary,
} from "@/api/doctors";
import type { Doctor } from "../types/doctor.types";
import { DoctorCard } from "./DoctorCard";

export function DoctorGrid({ doctors }: { doctors: Doctor[] }) {
  const summary = useQuery({
    queryKey: doctorAvailabilitySummaryKey,
    queryFn: ({ signal }) => getDoctorAvailabilitySummary(signal),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
  });

  return (
    <div className="grid grid-cols-1 gap-3 @min-[34rem]:grid-cols-2 @min-[48rem]:grid-cols-3">
      {doctors.map((doctor) => {
        const entry = summary.data?.find((item) =>
          doctor.mongoId
            ? item.doctorId === doctor.mongoId
            : item.slug === (doctor.slug ?? doctor._id),
        );
        return (
          <DoctorCard
            key={doctor._id}
            doctor={doctor}
            nextAvailableDate={entry?.nextAvailableDate}
            availabilityStatus={summary.status}
          />
        );
      })}
    </div>
  );
}
