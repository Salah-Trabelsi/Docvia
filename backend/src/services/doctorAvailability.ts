import type { IDoctor } from "../models/Doctor.js";
import type { ClientSession, Types } from "mongoose";
import { Appointment } from "../models/Appointment.js";

export const availabilityTimeZone = "Europe/Berlin";

export function doctorLocalDate(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: availabilityTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) =>
    parts.find((entry) => entry.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export interface BookedInterval {
  startsAt: Date;
  endsAt: Date;
}

// A padded UTC range includes the whole Berlin date range across DST changes.
export function getBookedIntervals(
  doctorId: Types.ObjectId | Types.ObjectId[],
  firstDate: string,
  lastDate: string,
  session?: ClientSession,
  excludeAppointmentId?: Types.ObjectId,
) {
  const from = new Date(
    new Date(`${firstDate}T00:00:00Z`).getTime() - 86_400_000,
  );
  const until = new Date(
    new Date(`${lastDate}T00:00:00Z`).getTime() + 2 * 86_400_000,
  );
  return Appointment.find({
    ...(excludeAppointmentId ? { _id: { $ne: excludeAppointmentId } } : {}),
    doctorId: Array.isArray(doctorId) ? { $in: doctorId } : doctorId,
    status: { $in: ["confirmed", "completed"] },
    startsAt: { $lt: until },
    endsAt: { $gt: from },
  })
    .select("doctorId startsAt endsAt -_id")
    .session(session ?? null)
    .lean();
}

export function excludeBookedSlots(
  slots: ReturnType<typeof getDoctorSlots>,
  bookings: BookedInterval[],
) {
  return slots.filter(
    (slot) =>
      !bookings.some(
        (booking) =>
          booking.startsAt.getTime() < new Date(slot.endAt).getTime() &&
          booking.endsAt.getTime() > new Date(slot.startAt).getTime(),
      ),
  );
}
const saturdayDoctors = new Set(["ethan-roberts", "laura-schmidt"]);
const berlinClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: availabilityTimeZone,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function minutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

// Working hours are daytime Berlin wall times. Noon supplies that day's DST offset.
function instant(date: string, minute: number): Date {
  const noon = new Date(`${date}T12:00:00Z`);
  const offset = minutes(berlinClock.format(noon)) - 12 * 60;
  return new Date(
    new Date(`${date}T00:00:00Z`).getTime() + (minute - offset) * 60_000,
  );
}

export function getDoctorSlots(
  doctor: IDoctor,
  date: string,
  now = new Date(),
) {
  if (!isCalendarDate(date) || doctor.isActive === false) return [];
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  // Exceptions cannot open a Sunday or a non-working Saturday.
  if (day === 0 || (day === 6 && !saturdayDoctors.has(doctor.slug ?? "")))
    return [];
  const weekly = (doctor.workingHours ?? []).filter(
    (hours) => hours.dayOfWeek === day,
  );
  if (!weekly.length) return [];
  const exception = doctor.dateExceptions?.find((entry) => entry.date === date);
  if (exception?.closed) return [];
  const hours = exception ? exception.hours : weekly;
  const duration = doctor.consultationDurationMinutes ?? 30;
  if (!Number.isInteger(duration) || duration < 1) return [];
  const slots = new Map<string, { startAt: string; endAt: string }>();
  for (const range of hours) {
    const start = Math.max(minutes(range.startTime), day === 6 ? 9 * 60 : 0);
    const end = Math.min(minutes(range.endTime), day === 6 ? 14 * 60 : 24 * 60);
    for (let minute = start; minute + duration <= end; minute += duration) {
      const startAt = instant(date, minute);
      if (startAt <= now) continue;
      const key = startAt.toISOString();
      slots.set(key, {
        startAt: key,
        endAt: instant(date, minute + duration).toISOString(),
      });
    }
  }
  return [...slots.values()].sort((a, b) => a.startAt.localeCompare(b.startAt));
}
