import { startOfDay } from "date-fns";
import { TZDate } from "react-day-picker";

export const bookingTimeZone = "Europe/Berlin";

export function bookingDay(value: Date | number) {
  return startOfDay(
    new TZDate(
      value instanceof Date ? value.getTime() : value,
      bookingTimeZone,
    ),
  );
}
