import type { Request, Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { Resend } from "resend";
import { z } from "zod";
import { User } from "../models/User.js";
import { validateEnv } from "../config/env.js";
import {
  emailChangeConfirmation,
  emailChangedNotification,
} from "../emails/emailChangeEmail.js";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const requestSchema = z
  .object({
    newEmail: emailSchema,
    currentPassword: z
      .string()
      .min(8)
      .refine((value) => Buffer.byteLength(value, "utf8") <= 72),
  })
  .strict();
const tokenSchema = z
  .object({ token: z.string().regex(/^[a-f\d]{64}$/) })
  .strict();
const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function requestEmailChange(req: Request, res: Response) {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Provide a valid email address and current password." });
    return;
  }
  try {
    const user = await User.findOne({
      _id: res.locals.userId,
      isActive: true,
    }).select("+passwordHash +sessionVersion");
    if (!user) {
      res.status(401).json({ message: "Session account is unavailable." });
      return;
    }
    if (
      !(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))
    ) {
      res.status(400).json({
        message: "Unable to request email change. Check your credentials.",
      });
      return;
    }
    const { newEmail } = parsed.data;
    if (
      newEmail === user.email ||
      (await User.exists({ email: newEmail, _id: { $ne: user._id } }))
    ) {
      res.status(409).json({ message: "This email address cannot be used." });
      return;
    }
    const env = validateEnv();
    if (!env.RESEND_API_KEY || !env.EMAIL_FROM_VERIFY)
      throw new Error("Email unavailable");
    const token = randomBytes(32).toString("hex");
    const now = new Date();
    const reserved = await User.findOneAndUpdate(
      {
        _id: user._id,
        email: user.email,
        passwordHash: user.passwordHash,
        isActive: true,
        $or: [
          { emailChangeRequestedAt: { $exists: false } },
          {
            emailChangeRequestedAt: { $lte: new Date(now.getTime() - 60_000) },
          },
        ],
      },
      {
        $set: {
          pendingEmail: newEmail,
          emailChangeTokenHash: hashToken(token),
          emailChangeExpiresAt: new Date(now.getTime() + 30 * 60_000),
          emailChangeRequestedAt: now,
          emailChangeSessionVersion: user.sessionVersion ?? 0,
        },
      },
      { new: true, runValidators: true },
    ).select("_id");
    if (!reserved) {
      res.set("Retry-After", "60").status(429).json({
        message:
          "Please wait one minute before requesting another email change, or sign in again if your account changed.",
      });
      return;
    }
    const link = new URL(
      `${env.FRONTEND_URL.replace(/\/$/, "")}/confirm-email-change`,
    );
    link.searchParams.set("token", token);
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
      from: env.EMAIL_FROM_VERIFY,
      to: newEmail,
      ...emailChangeConfirmation(user.firstName, link.toString()),
    });
    if (error) throw new Error("Delivery failed");
    res.json({
      message:
        "Confirmation requested. Check the new email inbox. Your current email remains unchanged until confirmation.",
    });
  } catch {
    res.status(500).json({
      message:
        "Unable to send confirmation. Your email has not changed. Please try again later.",
    });
  }
}

export async function confirmEmailChange(req: Request, res: Response) {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ message: "Invalid, expired or already used confirmation link." });
    return;
  }
  try {
    const tokenHash = hashToken(parsed.data.token);
    const candidate = await User.findOne({
      emailChangeTokenHash: tokenHash,
      emailChangeExpiresAt: { $gt: new Date() },
      isActive: true,
    }).select("email +pendingEmail +emailChangeSessionVersion");
    const pending = emailSchema.safeParse(candidate?.pendingEmail);
    if (
      !candidate ||
      !pending.success ||
      pending.data === candidate.email ||
      candidate.emailChangeSessionVersion === undefined
    ) {
      res.status(400).json({
        message: "Invalid, expired or already used confirmation link.",
      });
      return;
    }
    // Unique email index is authoritative. Returning the old document provides
    // the notification address from the same atomic operation that consumes the token.
    const previous = await User.findOneAndUpdate(
      {
        _id: candidate._id,
        email: candidate.email,
        pendingEmail: pending.data,
        emailChangeTokenHash: tokenHash,
        emailChangeExpiresAt: { $gt: new Date() },
        isActive: true,
        $expr: {
          $eq: [
            { $ifNull: ["$sessionVersion", 0] },
            candidate.emailChangeSessionVersion,
          ],
        },
      },
      {
        $set: { email: pending.data, isEmailVerified: true },
        $inc: { sessionVersion: 1 },
        $unset: {
          pendingEmail: 1,
          emailChangeTokenHash: 1,
          emailChangeExpiresAt: 1,
          emailChangeRequestedAt: 1,
          emailChangeSessionVersion: 1,
          emailVerificationTokenHash: 1,
          emailVerificationExpiresAt: 1,
          emailVerificationRequestedAt: 1,
          passwordResetTokenHash: 1,
          passwordResetExpiresAt: 1,
        },
      },
      { new: false, runValidators: true },
    ).select("email firstName");
    if (!previous) {
      res.status(400).json({
        message: "Invalid, expired or already used confirmation link.",
      });
      return;
    }

    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
    // Notification failures must not report failure after the email was committed.
    try {
      const env = validateEnv();
      if (!env.RESEND_API_KEY || !env.EMAIL_FROM_SECURITY)
        throw new Error("Email unavailable");
      const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
        from: env.EMAIL_FROM_SECURITY,
        to: previous.email,
        ...emailChangedNotification(previous.firstName),
      });
      if (error) throw new Error("Delivery failed");
    } catch {
      console.error("Email-change security notification could not be sent.");
    }
    res.json({
      message:
        "Email changed successfully. Please sign in with your new email address.",
    });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      res.status(409).json({
        message:
          "The new email address is no longer available. Your email has not changed.",
      });
      return;
    }
    res.status(500).json({
      message: "Unable to confirm email change. Please try again later.",
    });
  }
}
