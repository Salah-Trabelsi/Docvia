import { createHash, randomBytes } from "node:crypto";
import { Resend } from "resend";
import { User } from "../models/User.js";
import { validateEnv } from "../config/env.js";
import { verificationEmail } from "../emails/verificationEmail.js";

export function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Atomic cooldown reservation also serializes simultaneous resend requests.
export async function sendVerificationEmail(email: string) {
  const env = validateEnv();
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM_VERIFY)
    throw new Error("Email service unavailable");
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const user = await User.findOneAndUpdate(
    {
      email,
      isEmailVerified: false,
      isActive: true,
      $or: [
        { emailVerificationRequestedAt: { $exists: false } },
        {
          emailVerificationRequestedAt: {
            $lte: new Date(now.getTime() - 60_000),
          },
        },
      ],
    },
    {
      $set: {
        emailVerificationTokenHash: hashVerificationToken(token),
        emailVerificationExpiresAt: new Date(
          now.getTime() + 24 * 60 * 60 * 1000,
        ),
        emailVerificationRequestedAt: now,
      },
    },
    { new: true, runValidators: true },
  ).select("firstName email");
  if (!user) return;

  const link = new URL(`${env.FRONTEND_URL.replace(/\/$/, "")}/verify-email`);
  link.searchParams.set("token", token);
  const { error } = await new Resend(env.RESEND_API_KEY).emails.send({
    from: env.EMAIL_FROM_VERIFY,
    to: user.email,
    ...verificationEmail(user.firstName, link.toString()),
  });
  // Never log provider errors: they may contain the email body or token URL.
  if (error) throw new Error("Verification email delivery failed");
}
