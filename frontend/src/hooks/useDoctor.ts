import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { useQuery } from "@tanstack/react-query";
import { getDoctorBySlug } from "../api/doctors";

export const useDoctor = (slug?: string) => {
  return useQuery({
    queryKey: doctorKeys.detail(slug),
    queryFn: () => getDoctorBySlug(slug!),
    enabled: Boolean(slug),
  });
};
