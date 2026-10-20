import type { Request, Response } from "express";
import mongoose from "mongoose";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { Appointment } from "../models/Appointment.js";
import { Doctor } from "../models/Doctor.js";
import { User } from "../models/User.js";
import {
  doctorLocalDate,
  excludeBookedSlots,
  getBookedIntervals,
  getDoctorSlots,
} from "../services/doctorAvailability.js";
import {
  enqueueAppointmentEmail,
  enqueueRescheduledEmail,
} from "../services/appointmentEmail.js";

const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const bookingSchema = z
  .object({
    doctorId: objectId,
    startsAt: z
      .string()
      .datetime({ offset: true })
      .refine((value) => Number.isFinite(Date.parse(value))),
    notes: z.string().trim().max(1000).optional(),
  })
  .strict();
const doctorInfo = {
  path: "doctorId",
  select: "firstName lastName slug specialty imageUrl clinic",
};
const appointmentFields =
  "_id doctorId startsAt endsAt status notes createdAt updatedAt";
const rescheduleSchema = z
  .object({
    startsAt: z
      .string()
      .datetime({ offset: true })
      .refine((value) => Number.isFinite(Date.parse(value))),
  })
  .strict();

async function completeEndedAppointments() {
  // The status predicate makes this idempotent and leaves cancelled bookings alone.
  await Appointment.updateMany(
    { status: "confirmed", endsAt: { $lte: new Date() } },
    { $set: { status: "completed" } },
  );
}

class BookingError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export async function rescheduleAppointment(req: Request, res: Response) {
  if (!objectId.safeParse(req.params.id).success)
    return res.status(400).json({ message: "Invalid appointment ID." });
  const parsed = rescheduleSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Provide only a valid ISO startsAt timestamp." });
  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt.getTime() <= Date.now())
    return res
      .status(400)
      .json({ message: "Appointments must be in the future." });
  const changeId = randomUUID();
  try {
    // Keep the originally observed version across transaction retries: two
    // concurrent requests must not silently move the same appointment twice.
    const original = await Appointment.findOne({
      _id: req.params.id,
      patientId: res.locals.userId,
    })
      .select("patientId doctorId startsAt endsAt status __v")
      .lean();
    if (!original)
      return res.status(404).json({ message: "Appointment not found." });
    const result = await mongoose.connection.transaction(
      async (session) => {
        const patient = await User.findOneAndUpdate(
          {
            _id: res.locals.userId,
            isActive: true,
            $or: [
              { sessionVersion: res.locals.sessionVersion },
              ...(res.locals.sessionVersion === 0
                ? [{ sessionVersion: { $exists: false } }]
                : []),
            ],
          },
          { $inc: { __v: 1 } },
          { session, new: true, timestamps: false },
        ).select("role isEmailVerified");
        if (!patient)
          throw new BookingError(
            401,
            "Session account is unavailable. Please sign in again.",
          );
        if (patient.role !== "patient")
          throw new BookingError(
            403,
            "Only patients can reschedule appointments.",
          );
        if (!patient.isEmailVerified)
          throw new BookingError(
            403,
            "Verify your email before rescheduling an appointment.",
          );
        const current = await Appointment.findOne({
          _id: original._id,
          patientId: patient._id,
        })
          .select("patientId doctorId startsAt endsAt status __v")
          .session(session)
          .lean();
        if (!current) throw new BookingError(404, "Appointment not found.");
        if (
          current.status !== "confirmed" ||
          current.startsAt.getTime() <= Date.now()
        ) {
          throw new BookingError(
            409,
            "Only confirmed future appointments can be rescheduled.",
          );
        }
        if (
          (current.__v ?? 0) !== (original.__v ?? 0) ||
          current.startsAt.getTime() !== original.startsAt.getTime() ||
          current.endsAt.getTime() !== original.endsAt.getTime() ||
          !current.doctorId.equals(original.doctorId)
        ) {
          throw new BookingError(
            409,
            "This appointment changed. Refresh before rescheduling.",
          );
        }
        if (startsAt.getTime() === current.startsAt.getTime())
          throw new BookingError(400, "Choose a different appointment time.");
        const doctor = await Doctor.findOneAndUpdate(
          { _id: current.doctorId, isActive: true },
          { $inc: { __v: 1 } },
          { session, new: true, timestamps: false },
        ).lean();
        if (!doctor) throw new BookingError(404, "Doctor not found.");
        const now = new Date();
        if (startsAt <= now)
          throw new BookingError(400, "Appointments must be in the future.");
        if (current.startsAt <= now)
          throw new BookingError(409, "This appointment has already started.");
        const date = doctorLocalDate(startsAt);
        const slot = getDoctorSlots(doctor, date, now).find(
          (value) => value.startAt === startsAt.toISOString(),
        );
        if (!slot)
          throw new BookingError(
            400,
            "Choose an available appointment time from the doctor calendar.",
          );
        const bookings = await getBookedIntervals(
          doctor._id,
          date,
          date,
          session,
          current._id,
        );
        if (!excludeBookedSlots([slot], bookings).length)
          throw new BookingError(
            409,
            "This appointment time is already booked. Choose another time.",
          );
        const endsAt = new Date(slot.endAt);
        if (
          current.startsAt.getTime() <= Date.now() ||
          startsAt.getTime() <= Date.now()
        ) {
          throw new BookingError(
            409,
            "The appointment time has passed. Refresh and choose a future time.",
          );
        }
        const updated = await Appointment.findOneAndUpdate(
          {
            _id: current._id,
            patientId: patient._id,
            doctorId: doctor._id,
            status: "confirmed",
            startsAt: current.startsAt,
            endsAt: current.endsAt,
            $or: [
              { __v: original.__v ?? 0 },
              ...((original.__v ?? 0) === 0
                ? [{ __v: { $exists: false } }]
                : []),
            ],
          },
          {
            $set: { startsAt, endsAt },
            $inc: { __v: 1 },
            $push: {
              rescheduleHistory: {
                previousStartsAt: current.startsAt,
                previousEndsAt: current.endsAt,
                changedAt: now,
              },
            },
          },
          { session, new: true, runValidators: true },
        )
          .select(appointmentFields)
          .populate(doctorInfo)
          .lean();
        if (!updated)
          throw new BookingError(
            409,
            "This appointment changed. Refresh before rescheduling.",
          );
        await enqueueRescheduledEmail(
          current._id,
          changeId,
          {
            previousStartsAt: current.startsAt,
            previousEndsAt: current.endsAt,
            startsAt,
            endsAt,
          },
          session,
        );
        return updated;
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
    );
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof BookingError)
      return res.status(error.status).json({ message: error.message });
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      [11000, 112, 244, 251].includes(Number(error.code))
    ) {
      return res.status(409).json({
        message:
          "The appointment or requested slot changed. Refresh and try again.",
      });
    }
    return res.status(500).json({
      message: "Unable to reschedule appointment. Please try again later.",
    });
  }
}

export async function createAppointment(req: Request, res: Response) {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({
      message:
        "Provide a valid doctorId, ISO startsAt and notes of at most 1000 characters.",
    });
  const startsAt = new Date(parsed.data.startsAt);
  if (startsAt.getTime() <= Date.now())
    return res
      .status(400)
      .json({ message: "Appointments must be in the future." });
  try {
    const result = await mongoose.connection.transaction(
      async (session) => {
        // A real write serializes booking with account deletion and session changes.
        const patient = await User.findOneAndUpdate(
          {
            _id: res.locals.userId,
            isActive: true,
            $or: [
              { sessionVersion: res.locals.sessionVersion },
              ...(res.locals.sessionVersion === 0
                ? [{ sessionVersion: { $exists: false } }]
                : []),
            ],
          },
          { $inc: { __v: 1 } },
          { session, new: true, timestamps: false },
        ).select("role isEmailVerified");
        if (!patient)
          throw new BookingError(
            401,
            "Session account is unavailable. Please sign in again.",
          );
        if (patient.role !== "patient")
          throw new BookingError(403, "Only patients can book appointments.");
        if (!patient.isEmailVerified)
          throw new BookingError(
            403,
            "Verify your email before booking an appointment.",
          );

        // Serializes overlap checks even if a schedule changes its slot boundaries.
        const doctor = await Doctor.findOneAndUpdate(
          { _id: parsed.data.doctorId, isActive: true },
          { $inc: { __v: 1 } },
          { session, new: true, timestamps: false },
        ).lean();
        if (!doctor) throw new BookingError(404, "Doctor not found.");
        if (!doctor.acceptingNewPatients)
          throw new BookingError(
            409,
            "This doctor is not accepting new patients.",
          );
        const now = new Date();
        if (startsAt <= now)
          throw new BookingError(400, "Appointments must be in the future.");
        const date = doctorLocalDate(startsAt);
        const slot = getDoctorSlots(doctor, date, now).find(
          (value) => value.startAt === startsAt.toISOString(),
        );
        if (!slot)
          throw new BookingError(
            400,
            "Choose an available appointment time from the doctor calendar.",
          );
        const bookings = await getBookedIntervals(
          doctor._id,
          date,
          date,
          session,
        );
        if (!excludeBookedSlots([slot], bookings).length)
          throw new BookingError(
            409,
            "This appointment time is already booked. Choose another time.",
          );
        const [appointment] = await Appointment.create(
          [
            {
              patientId: patient._id,
              doctorId: doctor._id,
              startsAt,
              endsAt: new Date(slot.endAt),
              status: "confirmed",
              notes: parsed.data.notes,
            },
          ],
          { session },
        );
        await enqueueAppointmentEmail(appointment._id, "confirmation", session);
        return {
          _id: appointment._id,
          doctorId: appointment.doctorId,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          status: appointment.status,
          notes: appointment.notes,
        };
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
    );
    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof BookingError)
      return res.status(error.status).json({ message: error.message });
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return res.status(409).json({
        message:
          "This appointment time is already booked. Choose another time.",
      });
    }
    return res.status(500).json({
      message: "Unable to book the appointment. Please try again later.",
    });
  }
}

export async function getMyAppointments(_req: Request, res: Response) {
  try {
    await completeEndedAppointments();
    const appointments = await Appointment.find({
      patientId: res.locals.userId,
    })
      .select(appointmentFields)
      .populate(doctorInfo)
      .sort({ startsAt: 1, _id: 1 })
      .lean();
    return res.json(appointments);
  } catch {
    return res.status(500).json({ message: "Unable to load appointments." });
  }
}

export async function getAppointment(req: Request, res: Response) {
  if (!objectId.safeParse(req.params.id).success)
    return res.status(400).json({ message: "Invalid appointment ID." });
  try {
    await completeEndedAppointments();
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: res.locals.userId,
    })
      .select(appointmentFields)
      .populate(doctorInfo)
      .lean();
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });
    return res.json(appointment);
  } catch {
    return res.status(500).json({ message: "Unable to load appointment." });
  }
}

export async function cancelAppointment(req: Request, res: Response) {
  if (!objectId.safeParse(req.params.id).success)
    return res.status(400).json({ message: "Invalid appointment ID." });
  try {
    const filter = { _id: req.params.id, patientId: res.locals.userId };
    const appointment = await mongoose.connection.transaction(
      async (session) => {
        const updated = await Appointment.findOneAndUpdate(
          { ...filter, status: "confirmed", startsAt: { $gt: new Date() } },
          { $set: { status: "cancelled" } },
          { new: true, runValidators: true, session },
        )
          .select(appointmentFields)
          .populate(doctorInfo)
          .lean();
        if (updated)
          await enqueueAppointmentEmail(updated._id, "cancellation", session);
        return updated;
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
    );
    if (appointment) return res.json(appointment);
    if (!(await Appointment.exists(filter)))
      return res.status(404).json({ message: "Appointment not found." });
    return res.status(409).json({
      message: "Only confirmed future appointments can be cancelled.",
    });
  } catch {
    return res.status(500).json({ message: "Unable to cancel appointment." });
  }
}
