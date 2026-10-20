import { Schema, model, type Types } from "mongoose";

export interface IAppointment {
  patientId: Types.ObjectId;
  doctorId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  status: "confirmed" | "cancelled" | "completed";
  notes?: string;
  __v?: number;
  rescheduleHistory?: {
    previousStartsAt: Date;
    previousEndsAt: Date;
    changedAt: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
}

const appointmentSchema = new Schema<IAppointment>(
  {
    patientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed"],
      default: "confirmed",
      required: true,
    },
    notes: { type: String, trim: true, maxlength: 1000 },
    rescheduleHistory: {
      type: [
        new Schema(
          {
            previousStartsAt: { type: Date, required: true },
            previousEndsAt: { type: Date, required: true },
            changedAt: { type: Date, required: true },
          },
          { _id: false },
        ),
      ],
      default: [],
    },
  },
  { timestamps: true, collection: "appointments" },
);

appointmentSchema.pre("validate", function () {
  if (this.startsAt && this.endsAt && this.endsAt <= this.startsAt) {
    this.invalidate("endsAt", "Appointment end must be after its start.");
  }
});
appointmentSchema.index(
  { doctorId: 1, startsAt: 1 },
  {
    name: "unique_active_doctor_start",
    unique: true,
    partialFilterExpression: { status: { $in: ["confirmed", "completed"] } },
  },
);
appointmentSchema.index(
  { patientId: 1, startsAt: -1 },
  { name: "patient_appointments" },
);
appointmentSchema.index(
  { doctorId: 1, startsAt: 1 },
  { name: "doctor_availability" },
);
appointmentSchema.index(
  { status: 1, endsAt: 1 },
  { name: "appointment_completion" },
);

appointmentSchema.index(
  { status: 1, startsAt: 1 },
  { name: "appointment_reminders" },
);

export const Appointment = model<IAppointment>(
  "Appointment",
  appointmentSchema,
);
