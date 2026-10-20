import mongoose from "mongoose";
import { Appointment } from "../models/Appointment.js";
import { AppointmentEmailEvent } from "../models/AppointmentEmailEvent.js";
import { User } from "../models/User.js";
import { createAppointmentNotification } from "./notifications.js";

const dayMs = 24 * 60 * 60_000;
export const reminderCatchUpMs = 60 * 60_000;

// Called by the worker; the optional simulation is only for the guarded CLI.
export async function enqueueDueReminder(id: string, simulate = false) {
  if (simulate && process.env.NODE_ENV !== "development")
    throw new Error("Simulation requires development mode");
  await mongoose.connection.transaction(async (session) => {
    const appointment = await Appointment.findById(id).session(session).lean();
    if (!appointment || appointment.status !== "confirmed") return;
    const now = new Date();
    const history = appointment.rescheduleHistory ?? [];
    const version = history.length;
    const scheduledAt = history.at(-1)?.changedAt ?? appointment.createdAt;
    const dueAt = simulate
      ? now
      : new Date(appointment.startsAt.getTime() - dayMs);
    if (
      appointment.startsAt <= now ||
      !scheduledAt ||
      (!simulate &&
        (scheduledAt > dueAt ||
          dueAt > now ||
          now.getTime() - dueAt.getTime() > reminderCatchUpMs))
    )
      return;
    if (
      simulate &&
      (!appointment.createdAt ||
        now.getTime() - appointment.createdAt.getTime() > 10 * 60_000 ||
        appointment.startsAt.getTime() - now.getTime() < dayMs)
    ) {
      throw new Error(
        "Use a newly created appointment more than 24 hours in the future",
      );
    }
    if (
      await AppointmentEmailEvent.exists({
        appointmentId: appointment._id,
        kind: "reminder",
        scheduleVersion: version,
      }).session(session)
    )
      return;
    // Coordinate with account deletion, preference updates and appointment edits.
    const patient = await User.findOneAndUpdate(
      { _id: appointment.patientId, isActive: true },
      { $inc: { __v: 1 } },
      { session, timestamps: false },
    ).select("_id");
    if (!patient) return;
    const locked = await Appointment.updateOne(
      {
        _id: appointment._id,
        status: "confirmed",
        startsAt: appointment.startsAt,
        $or: [
          { __v: appointment.__v ?? 0 },
          ...((appointment.__v ?? 0) === 0
            ? [{ __v: { $exists: false } }]
            : []),
        ],
      },
      { $inc: { __v: 1 } },
      { session, timestamps: false },
    );
    if (!locked.matchedCount) return;
    await AppointmentEmailEvent.create(
      [
        {
          appointmentId: appointment._id,
          kind: "reminder",
          scheduleVersion: version,
          startsAt: appointment.startsAt,
          endsAt: appointment.endsAt,
          reminderDueAt: dueAt,
        },
      ],
      { session },
    );
    await createAppointmentNotification(
      appointment.patientId,
      appointment._id,
      "reminder",
      `reminder:${appointment._id}:${version}`,
      session,
    );
  });
}

export async function enqueueDueReminders() {
  const now = Date.now();
  const cursor = Appointment.find({
    status: "confirmed",
    startsAt: {
      $gt: new Date(now + dayMs - reminderCatchUpMs),
      $lte: new Date(now + dayMs),
    },
  })
    .select("_id")
    .lean()
    .cursor();
  for await (const appointment of cursor) {
    try {
      await enqueueDueReminder(appointment._id.toString());
    } catch (error) {
      // Another worker may have enqueued the same schedule concurrently.
      if (!(
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ))
        throw error;
    }
  }
}
