import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: "Appointment" },
    eventKey: { type: String, required: true },
    type: {
      type: String,
      enum: ["confirmation", "cancellation", "rescheduled", "reminder"],
      required: true,
    },
    title: { type: String, required: true, maxlength: 120 },
    message: { type: String, required: true, maxlength: 500 },
    readAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "notifications" },
);
schema.index({ userId: 1, eventKey: 1 }, { unique: true });
schema.index({ userId: 1, readAt: 1, createdAt: -1 });
schema.index({ userId: 1, createdAt: -1, _id: -1 });
schema.index({ appointmentId: 1, type: 1 });
export const Notification = model("Notification", schema);
