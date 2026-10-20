import type { Request, Response } from "express";
import { z } from "zod";
import { User } from "../models/User.js";

const preferencesSchema = z
  .object({ appointmentReminders: z.boolean() })
  .strict();
export async function getNotificationPreferences(_req: Request, res: Response) {
  try {
    const user = await User.findById(res.locals.userId)
      .select("notificationPreferences")
      .lean();
    if (!user) return res.status(401).json({ message: "Account unavailable." });
    return res.json({
      appointmentReminders:
        user.notificationPreferences?.appointmentReminders !== false,
    });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to load notification preferences." });
  }
}
export async function updateNotificationPreferences(
  req: Request,
  res: Response,
) {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Provide only an appointmentReminders boolean." });
  try {
    const user = await User.findOneAndUpdate(
      { _id: res.locals.userId, isActive: true },
      {
        $set: {
          "notificationPreferences.appointmentReminders":
            parsed.data.appointmentReminders,
        },
      },
      { new: true, runValidators: true },
    )
      .select("notificationPreferences")
      .lean();
    if (!user) return res.status(401).json({ message: "Account unavailable." });
    return res.json({
      appointmentReminders:
        user.notificationPreferences?.appointmentReminders !== false,
    });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to save notification preferences." });
  }
}
