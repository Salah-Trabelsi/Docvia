import { z } from "zod";

const validPassword = z
  .string()
  .min(8, "Use at least 8 characters.")
  .refine(
    (value) => new TextEncoder().encode(value).length <= 72,
    "Use no more than 72 UTF-8 bytes.",
  );

export const passwordSchema = z
  .object({
    currentPassword: validPassword,
    newPassword: validPassword,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    path: ["newPassword"],
    message: "Choose a different password.",
  });

export const emailSchema = z
  .object({
    email: z.string().trim().email("Enter a valid email address."),
    confirmEmail: z.string().trim().email("Enter a valid email address."),
  })
  .refine((data) => data.email === data.confirmEmail, {
    path: ["confirmEmail"],
    message: "Email addresses do not match.",
  });
