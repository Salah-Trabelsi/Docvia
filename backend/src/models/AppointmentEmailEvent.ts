import { Schema, model, type Types } from "mongoose";

export type AppointmentEmailKind =
  "confirmation" | "cancellation" | "rescheduled" | "reminder";
interface IAppointmentEmailEvent {
  appointmentId: Types.ObjectId;
  kind: AppointmentEmailKind;
  scheduleVersion?: number;
  reminderDueAt?: Date;
  changeId?: string;
  previousStartsAt?: Date;
  previousEndsAt?: Date;
  startsAt?: Date;
  endsAt?: Date;
  status: "pending" | "processing" | "sent" | "skipped" | "review";
  attempts: number;
  nextAttemptAt: Date;
  leaseUntil?: Date;
  leaseToken?: string;
  firstSendAt?: Date;
  payloadHash?: string;
  providerId?: string;
  sentAt?: Date;
  lastError?: string;
}

const schema = new Schema<IAppointmentEmailEvent>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    kind: {
      type: String,
      enum: ["confirmation", "cancellation", "rescheduled", "reminder"],
      required: true,
    },
    scheduleVersion: { type: Number, immutable: true },
    reminderDueAt: { type: Date, immutable: true },
    changeId: { type: String, immutable: true },
    previousStartsAt: { type: Date, immutable: true },
    previousEndsAt: { type: Date, immutable: true },
    startsAt: { type: Date, immutable: true },
    endsAt: { type: Date, immutable: true },
    status: {
      type: String,
      enum: ["pending", "processing", "sent", "skipped", "review"],
      default: "pending",
      required: true,
    },
    attempts: { type: Number, default: 0 },
    nextAttemptAt: { type: Date, default: Date.now },
    leaseUntil: Date,
    leaseToken: String,
    firstSendAt: Date,
    payloadHash: String,
    providerId: String,
    sentAt: Date,
    // Fixed internal codes only, never provider error messages or recipient data.
    lastError: { type: String, maxlength: 80 },
  },
  { timestamps: true, collection: "appointmentEmailEvents" },
);

schema.index(
  { appointmentId: 1, kind: 1 },
  {
    unique: true,
    name: "unique_single_appointment_email",
    partialFilterExpression: {
      kind: { $in: ["confirmation", "cancellation"] },
    },
  },
);
schema.index(
  { appointmentId: 1, kind: 1, changeId: 1 },
  {
    unique: true,
    name: "unique_rescheduled_email",
    partialFilterExpression: { kind: "rescheduled" },
  },
);
schema.index(
  { appointmentId: 1, kind: 1, scheduleVersion: 1 },
  {
    unique: true,
    name: "unique_schedule_reminder",
    partialFilterExpression: { kind: "reminder" },
  },
);
schema.index({ status: 1, nextAttemptAt: 1 });
schema.index({ status: 1, leaseUntil: 1 });

export const AppointmentEmailEvent = model<IAppointmentEmailEvent>(
  "AppointmentEmailEvent",
  schema,
);

export async function ensureAppointmentEmailIndexes() {
  // Establish both replacement constraints before removing the old constraint.
  await AppointmentEmailEvent.createIndexes();
  try {
    await AppointmentEmailEvent.collection.dropIndex(
      "unique_appointment_email",
    );
  } catch (error) {
    if (!(
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 27
    ))
      throw error;
  }
}
