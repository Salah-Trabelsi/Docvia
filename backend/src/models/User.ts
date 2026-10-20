import { Schema, model, type Model, type Types } from "mongoose";

export interface IUser {
  _id?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  sessionVersion?: number;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  passwordResetRequestedAt?: Date;
  pendingEmail?: string;
  emailChangeTokenHash?: string;
  emailChangeExpiresAt?: Date;
  emailChangeRequestedAt?: Date;
  emailChangeSessionVersion?: number;
  role: "patient" | "admin";
  phone?: string;
  dateOfBirth?: Date;
  gender?: "Male" | "Female" | "Prefer not to say";
  avatarUrl?: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  emergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
  };
  notificationPreferences?: { appointmentReminders: boolean };
  favoriteDoctors: Types.ObjectId[];
  isEmailVerified: boolean;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  emailVerificationRequestedAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const emergencyContactSchema = new Schema<
  NonNullable<IUser["emergencyContact"]>
>(
  {
    name: { type: String, trim: true, maxlength: 100 },
    relationship: { type: String, trim: true, maxlength: 80 },
    phone: { type: String, trim: true, maxlength: 40 },
  },
  { _id: false },
);

const userSchema = new Schema<IUser>(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 80 },
    lastName: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid email address."],
    },
    passwordHash: { type: String, required: true, select: false },
    sessionVersion: { type: Number, default: 0, min: 0, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordResetRequestedAt: { type: Date, select: false },
    pendingEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 254,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      select: false,
    },
    emailChangeTokenHash: { type: String, select: false },
    emailChangeExpiresAt: { type: Date, select: false },
    emailChangeRequestedAt: { type: Date, select: false },
    emailChangeSessionVersion: { type: Number, select: false },
    role: { type: String, enum: ["patient", "admin"], default: "patient" },
    phone: { type: String, trim: true, maxlength: 40 },
    dateOfBirth: {
      type: Date,
      validate: {
        validator: (value: Date | null | undefined) =>
          value == null || value.getTime() <= Date.now(),
        message: "Date of birth cannot be in the future.",
      },
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say"],
      trim: true,
    },
    avatarUrl: { type: String, trim: true, maxlength: 2048 },
    streetAddress: { type: String, trim: true, maxlength: 160 },
    city: { type: String, trim: true, maxlength: 80 },
    postalCode: { type: String, trim: true, maxlength: 16 },
    country: { type: String, trim: true, maxlength: 80 },
    emergencyContact: { type: emergencyContactSchema, default: undefined },
    notificationPreferences: {
      appointmentReminders: { type: Boolean, default: true },
    },
    favoriteDoctors: {
      type: [{ type: Schema.Types.ObjectId, ref: "Doctor" }],
      default: [],
    },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationExpiresAt: { type: Date, select: false },
    emailVerificationRequestedAt: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "users" },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ emailChangeTokenHash: 1 }, { sparse: true });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });
userSchema.index({ emailVerificationTokenHash: 1 }, { sparse: true });

export const User: Model<IUser> = model<IUser>("User", userSchema);
export default User;
