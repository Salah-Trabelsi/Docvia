import type { Request, Response } from "express";
import { Doctor } from "../models/Doctor.js";
import {
  availabilityTimeZone,
  doctorLocalDate,
  excludeBookedSlots,
  getBookedIntervals,
  getDoctorSlots,
  isCalendarDate,
  type BookedInterval,
} from "../services/doctorAvailability.js";

export async function getDoctorAvailabilitySummary(
  _req: Request,
  res: Response,
) {
  res.set("Cache-Control", "no-store");
  try {
    const doctors = await Doctor.find({ isActive: true })
      .select(
        "_id slug isActive workingHours dateExceptions consultationDurationMinutes timeZone",
      )
      .lean();
    if (!doctors.length) return res.json([]);
    const now = new Date();
    const today = doctorLocalDate(now);
    // Thirty Berlin calendar dates: today through today + 29. UTC arithmetic is
    // only used on date labels, never on local appointment instants.
    const dates = Array.from({ length: 30 }, (_, offset) => {
      const day = new Date(`${today}T00:00:00Z`);
      day.setUTCDate(day.getUTCDate() + offset);
      return day.toISOString().slice(0, 10);
    });
    const bookings = await getBookedIntervals(
      doctors.map((doctor) => doctor._id),
      dates[0],
      dates[29],
    );
    const byDoctor = new Map<string, BookedInterval[]>();
    for (const booking of bookings) {
      const id = booking.doctorId.toString();
      const intervals = byDoctor.get(id) ?? [];
      intervals.push(booking);
      byDoctor.set(id, intervals);
    }
    return res.json(
      doctors.map((doctor) => ({
        doctorId: doctor._id.toString(),
        slug: doctor.slug,
        nextAvailableDate:
          dates.find(
            (date) =>
              excludeBookedSlots(
                getDoctorSlots(doctor, date, now),
                byDoctor.get(doctor._id.toString()) ?? [],
              ).length > 0,
          ) ?? null,
      })),
    );
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to load availability summary." });
  }
}

export async function getDoctorAvailability(req: Request, res: Response) {
  const date = req.query.date;
  if (typeof date !== "string" || !isCalendarDate(date)) {
    return res
      .status(400)
      .json({ message: "Provide a valid date (YYYY-MM-DD)." });
  }
  try {
    const doctor = await Doctor.findOne({
      slug: req.params.slug,
      isActive: true,
    }).lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const bookings = await getBookedIntervals(doctor._id, date, date);
    res.set("Cache-Control", "no-store");
    return res.json({
      date,
      timeZone: availabilityTimeZone,
      slots: excludeBookedSlots(getDoctorSlots(doctor, date), bookings),
    });
  } catch {
    return res.status(500).json({ message: "Unable to load availability." });
  }
}

export async function getDoctorCalendar(req: Request, res: Response) {
  const month = req.query.month;
  if (
    typeof month !== "string" ||
    !/^\d{4}-\d{2}$/.test(month) ||
    !isCalendarDate(`${month}-01`)
  ) {
    return res
      .status(400)
      .json({ message: "Provide a valid month (YYYY-MM)." });
  }
  try {
    const doctor = await Doctor.findOne({
      slug: req.params.slug,
      isActive: true,
    }).lean();
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    const now = new Date();
    const lastDay = new Date(`${month}-01T00:00:00Z`);
    lastDay.setUTCMonth(lastDay.getUTCMonth() + 1, 0);
    const bookings = await getBookedIntervals(
      doctor._id,
      `${month}-01`,
      lastDay.toISOString().slice(0, 10),
    );
    const days = [];
    for (let day = 1; day <= 31; day++) {
      const date = `${month}-${String(day).padStart(2, "0")}`;
      if (!isCalendarDate(date)) break;
      days.push({
        date,
        available:
          excludeBookedSlots(getDoctorSlots(doctor, date, now), bookings)
            .length > 0,
      });
    }
    res.set("Cache-Control", "no-store");
    return res.json({ month, timeZone: availabilityTimeZone, days });
  } catch {
    return res.status(500).json({ message: "Unable to load calendar." });
  }
}
