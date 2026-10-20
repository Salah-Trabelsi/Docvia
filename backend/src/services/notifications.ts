import type { ClientSession, Types } from "mongoose";
import { Notification } from "../models/Notification.js";

const content = {
  confirmation: [
    "Appointment confirmed",
    "Your appointment is confirmed. View My Appointments for details.",
  ],
  cancellation: [
    "Appointment cancelled",
    "Your appointment has been cancelled.",
  ],
  rescheduled: [
    "Appointment rescheduled",
    "Your appointment has a new date and time. View My Appointments for details.",
  ],
  reminder: [
    "Upcoming appointment",
    "Your appointment is in approximately 24 hours. View My Appointments for details.",
  ],
} as const;
export async function createAppointmentNotification(
  userId: Types.ObjectId,
  appointmentId: Types.ObjectId,
  type: keyof typeof content,
  eventKey: string,
  session: ClientSession,
) {
  const [title, message] = content[type];
  await Notification.updateOne(
    { userId, eventKey },
    { $setOnInsert: { userId, appointmentId, type, eventKey, title, message } },
    { upsert: true, session },
  );
}
