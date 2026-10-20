import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Appointment } from "../models/Appointment.js";
import { getCloudinary } from "../config/cloudinary.js";
import { ownedPublicId } from "../services/avatarOwnership.js";

import { Notification } from "../models/Notification.js";

const deletionSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(8)
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  })
  .strict();

class DeletionConflict extends Error {}

export async function deleteAccount(req: Request, res: Response) {
  const parsed = deletionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: "Provide a valid email and password." });
    return;
  }
  try {
    const user = await User.findOne({
      _id: res.locals.userId,
      isActive: true,
    }).select("+passwordHash");
    if (!user) {
      res.status(401).json({ message: "Session account is unavailable." });
      return;
    }
    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      user.passwordHash,
    );
    if (parsed.data.email !== user.email || !passwordMatches) {
      res
        .status(400)
        .json({ message: "Unable to delete account. Check your credentials." });
      return;
    }

    // Reviews remain subject to manual review until a review deletion policy exists.
    const ids = [user._id, user._id.toString()];
    const references = {
      $or: [
        "patient",
        "patientId",
        "user",
        "userId",
        "author",
        "authorId",
        "patient._id",
        "user._id",
        "author._id",
      ].map((field) => ({ [field]: { $in: ids } })),
    };
    const db = User.db.db;
    if (!db) throw new Error("Database unavailable");

    // Validate cleanup configuration before committing an irreversible deletion.
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
    const avatarId = ownedPublicId(
      user.avatarUrl,
      cloudName,
      user._id.toString(),
    );
    const cloudinary = avatarId ? getCloudinary() : undefined;
    await mongoose.connection.transaction(
      async (session) => {
        // Booking writes this same User document, so it cannot race deletion.
        const deleted = await User.findOneAndDelete(
          {
            _id: user._id,
            email: user.email,
            passwordHash: user.passwordHash,
            isActive: true,
            avatarUrl: user.avatarUrl ?? null,
          },
          { session },
        ).select("_id");
        if (!deleted)
          throw new DeletionConflict(
            "Your account changed. Refresh and try again.",
          );
        const review = await db
          .collection("reviews")
          .findOne(references, { projection: { _id: 1 }, session });
        if (review)
          throw new DeletionConflict(
            "Account deletion requires review of linked reviews. Please contact support.",
          );
        await Appointment.updateMany(
          {
            patientId: user._id,
            status: "confirmed",
            startsAt: { $gt: new Date() },
          },
          { $set: { status: "cancelled" } },
          { session },
        );
        // Demo policy: remove all of this patient's appointment data, including notes.
        await Appointment.deleteMany({ patientId: user._id }, { session });
        await Notification.deleteMany({ userId: user._id }, { session });
      },
      { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } },
    );

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    if (avatarId && cloudinary) {
      // External cleanup cannot roll back a deleted MongoDB user. Retry and log
      // only the owned asset ID for manual cleanup if the provider stays down.
      let cleaned = false;
      for (let attempt = 0; attempt < 3 && !cleaned; attempt++) {
        try {
          const result = await cloudinary.uploader.destroy(avatarId, {
            resource_type: "image",
            invalidate: true,
          });
          cleaned = result.result === "ok" || result.result === "not found";
        } catch {
          /* Retry without logging provider credentials or response data. */
        }
      }
      if (!cleaned)
        console.error("Deleted-account avatar requires cleanup:", avatarId);
    }
    res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    if (error instanceof DeletionConflict) {
      res.status(409).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Unable to complete account deletion. Please try again later.",
    });
  }
}
