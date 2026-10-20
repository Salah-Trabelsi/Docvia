import type { QueryClient } from "@tanstack/react-query";
import { doctorKeys } from "./doctorKeys";

/** Omit slug to refresh all doctors, as cancellation already does. */
export async function invalidateDoctorAvailability(
  client: QueryClient,
  slug?: string,
) {
  await Promise.all([
    client.invalidateQueries({ queryKey: doctorKeys.availability(slug) }),
    client.invalidateQueries({ queryKey: doctorKeys.calendar(slug) }),
    client.invalidateQueries({ queryKey: doctorKeys.summary }),
  ]);
}
