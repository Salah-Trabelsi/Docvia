import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { validateEnv } from "../config/env.js";
import { Appointment } from "../models/Appointment.js";
import { Notification } from "../models/Notification.js";
import { ensureAppointmentEmailIndexes } from "../models/AppointmentEmailEvent.js";
import { enqueueDueReminder } from "../services/appointmentReminders.js";

// Queues only. This command never calls Resend or starts the worker.
async function main() {
  const [appointmentId, patientId, acknowledgement] = process.argv.slice(2);
  if (
    process.env.NODE_ENV !== "development" ||
    acknowledgement !== "--test-account-only" ||
    !/^[a-f\d]{24}$/i.test(appointmentId ?? "") ||
    !/^[a-f\d]{24}$/i.test(patientId ?? "")
  ) {
    throw new Error(
      "Use development mode and provide appointment ID, test patient ID and --test-account-only",
    );
  }
  validateEnv();
  await connectDB();
  const appointment = await Appointment.findOne({
    _id: appointmentId,
    patientId,
    status: "confirmed",
  }).lean();
  if (!appointment) throw new Error("Confirmed test appointment not found");
  await ensureAppointmentEmailIndexes();
  await Notification.createIndexes();
  await enqueueDueReminder(appointmentId, true);
  console.info(
    "Reminder simulation queued (or already queued). No email sent by this command.",
  );
}
try {
  await main();
} catch {
  console.error(
    "Simulation refused or failed. Check development mode, IDs, test-account flag and that the appointment was created within 10 minutes and starts more than 24 hours from now.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
