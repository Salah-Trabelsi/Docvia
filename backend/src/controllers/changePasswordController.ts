import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";
import { User } from "../models/User.js";

const passwordSchema = z
  .string()
  .min(8)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes.",
  );
const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
  })
  .strict();

export async function changePassword(req: Request, res: Response) {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      message:
        "Passwords must contain at least 8 characters and at most 72 UTF-8 bytes.",
    });
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
    const { currentPassword, newPassword } = parsed.data;
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      res.status(400).json({
        message: "Unable to change password. Check your credentials.",
      });
      return;
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      res.status(400).json({
        message: "Choose a different password from your current password.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    // Compare the old hash so a concurrent reset/change cannot be overwritten.
    const updated = await User.findOneAndUpdate(
      {
        _id: user._id,
        isActive: true,
        passwordHash: user.passwordHash,
      },
      {
        $set: { passwordHash },
        $inc: { sessionVersion: 1 },
        $unset: { passwordResetTokenHash: 1, passwordResetExpiresAt: 1 },
      },
      { new: true, runValidators: true },
    ).select("_id");
    if (!updated) {
      res.status(409).json({
        message: "Account credentials changed. Please sign in again.",
      });
      return;
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    res.status(200).json({
      message: "Password changed successfully. Please sign in again.",
    });
  } catch {
    res
      .status(500)
      .json({ message: "Unable to change password. Please try again later." });
  }
}
