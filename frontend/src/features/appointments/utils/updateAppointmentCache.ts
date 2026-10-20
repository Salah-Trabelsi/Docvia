import type { QueryClient } from "@tanstack/react-query";
import { appointmentKeys, type PatientAppointment } from "@/api/appointments";

/** Called only after server success and cancellation of stale appointment reads. */
export function updateAppointmentCache(
  client: QueryClient,
  userId: string,
  updated: PatientAppointment,
) {
  client.setQueriesData<PatientAppointment[]>(
    { queryKey: appointmentKeys.list(userId), exact: true },
    (old) => old?.map((item) => (item._id === updated._id ? updated : item)),
  );
  client.setQueriesData<PatientAppointment>(
    { queryKey: appointmentKeys.detail(userId, updated._id), exact: true },
    (old) => (old ? updated : undefined),
  );
}
