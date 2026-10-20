import type { Request, Response } from "express";
import { z } from "zod";
import { Notification } from "../models/Notification.js";
export async function listNotifications(_req: Request, res: Response) {
  try {
    res.set("Cache-Control", "no-store");
    return res.json(
      await Notification.find({ userId: res.locals.userId })
        .select("_id appointmentId type title message readAt createdAt")
        .sort({ createdAt: -1, _id: -1 })
        .limit(30)
        .lean(),
    );
  } catch {
    return res.status(500).json({ message: "Unable to load notifications." });
  }
}
export async function unreadCount(_req: Request, res: Response) {
  try {
    res.set("Cache-Control", "no-store");
    return res.json({
      count: await Notification.countDocuments({
        userId: res.locals.userId,
        readAt: null,
      }),
    });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to load notification count." });
  }
}
export async function markRead(req: Request, res: Response) {
  if (
    !z
      .string()
      .regex(/^[a-f\d]{24}$/i)
      .safeParse(req.params.id).success
  )
    return res.status(400).json({ message: "Invalid notification ID." });
  try {
    const filter = { _id: req.params.id, userId: res.locals.userId };
    await Notification.updateOne(
      { ...filter, readAt: null },
      { $set: { readAt: new Date() } },
    );
    if (!(await Notification.exists(filter)))
      return res.status(404).json({ message: "Notification not found." });
    return res.json({ message: "Notification marked read." });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to mark notification read." });
  }
}
export async function markAllRead(_req: Request, res: Response) {
  try {
    await Notification.updateMany(
      { userId: res.locals.userId, readAt: null },
      { $set: { readAt: new Date() } },
    );
    return res.json({ message: "Notifications marked read." });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to mark notifications read." });
  }
}
