import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { appointmentKeys, getMyAppointments } from "@/api/appointments";
import { useAuth } from "@/features/auth/useAuth";

export function useAppointments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: appointmentKeys.list(user?._id ?? ""),
    queryFn: ({ signal }) => getMyAppointments(signal),
    enabled: !!user,
    retry: (count, error) =>
      !(axios.isAxiosError(error) && error.response?.status === 401) &&
      count < 2,
    refetchInterval: 60_000,
  });
}
