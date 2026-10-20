import { bookingTimeZone } from "@/features/doctors/utils/availability";

export const appointmentDateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "full",
  timeZone: bookingTimeZone,
});
export const appointmentTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeStyle: "short",
  timeZone: bookingTimeZone,
});
