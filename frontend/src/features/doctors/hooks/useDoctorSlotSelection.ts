import { doctorKeys } from "@/features/doctors/queries/doctorKeys";
import { useState } from "react";
import { TZDate } from "react-day-picker";
import { addDays, format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { getDoctorAvailability, getDoctorCalendar } from "@/api/doctors";
import { bookingDay, bookingTimeZone as timeZone } from "../utils/availability";
import { useAvailabilityClock } from "./useAvailabilityClock";

export function useDoctorSlotSelection(slug: string, excludeStartsAt?: string) {
  const now = useAvailabilityClock();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string>();
  const today = bookingDay(now);
  const [month, setMonth] = useState(() => bookingDay(Date.now()));
  const lastDate = addDays(today, 365);
  const monthKey = format(new TZDate(month, timeZone), "yyyy-MM");
  const dateKey = date
    ? format(new TZDate(date, timeZone), "yyyy-MM-dd")
    : undefined;
  const calendar = useQuery({
    queryKey: doctorKeys.calendar(slug, monthKey),
    queryFn: ({ signal }) => getDoctorCalendar(slug, monthKey, signal),
    enabled: !!slug,
    refetchInterval: 30_000,
  });
  const availability = useQuery({
    queryKey: doctorKeys.slots(slug, dateKey),
    queryFn: ({ signal }) => getDoctorAvailability(slug, dateKey!, signal),
    enabled: !!slug && !!dateKey,
    refetchInterval: 30_000,
  });
  const availableDays = new Set(
    calendar.isError
      ? []
      : calendar.data?.days
          .filter((day) => day.available)
          .map((day) => day.date),
  );
  const dateUnavailable = (value: Date) => {
    const dayKey = format(new TZDate(value, timeZone), "yyyy-MM-dd");
    const todayKey = format(today, "yyyy-MM-dd");

    return dayKey < todayKey || !availableDays.has(dayKey);
  };
  const doctorTimeSlots = availability.isError
    ? []
    : (availability.data?.slots ?? []).filter((slot) => {
        const startsAt = Date.parse(slot.startAt);
        return (
          startsAt > now &&
          (!excludeStartsAt || startsAt !== Date.parse(excludeStartsAt))
        );
      });
  const validSelection =
    !!date &&
    !dateUnavailable(date) &&
    doctorTimeSlots.some((slot) => slot.startAt === time);

  return {
    now,
    date,
    setDate,
    time,
    setTime,
    today,
    month,
    setMonth,
    lastDate,
    calendar,
    availability,
    dateUnavailable,
    doctorTimeSlots,
    validSelection,
  };
}
