import type { Request, Response } from "express";
import { Types } from "mongoose";
import { z } from "zod";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";

const doctorIdSchema = z.string().regex(/^[a-f\d]{24}$/i);

export async function getFavorites(_req: Request, res: Response) {
  try {
    const user = await User.findOne({ _id: res.locals.userId, isActive: true })
      .select("role favoriteDoctors")
      .lean();
    if (!user)
      return res
        .status(401)
        .json({ message: "Session account is unavailable." });
    if (user.role !== "patient")
      return res
        .status(403)
        .json({ message: "Favorites are available to patients only." });
    return res.json({
      doctorIds: (user.favoriteDoctors ?? []).map((id) => id.toString()),
    });
  } catch {
    return res.status(500).json({ message: "Unable to load favorites." });
  }
}

async function updateFavorite(req: Request, res: Response, add: boolean) {
  const parsed = doctorIdSchema.safeParse(req.params.doctorId);
  if (!parsed.success)
    return res
      .status(400)
      .json({ message: "Provide a valid doctor ObjectId." });
  try {
    const patient = await User.findOne({
      _id: res.locals.userId,
      isActive: true,
    })
      .select("role")
      .lean();
    if (!patient)
      return res
        .status(401)
        .json({ message: "Session account is unavailable." });
    if (patient.role !== "patient")
      return res
        .status(403)
        .json({ message: "Favorites are available to patients only." });
    const doctorId = new Types.ObjectId(parsed.data);
    if (add && !(await Doctor.exists({ _id: doctorId, isActive: true }))) {
      return res.status(404).json({ message: "Active doctor not found." });
    }
    // Removal also permits stale/inactive doctor references to be cleared.
    const user = await User.findOneAndUpdate(
      { _id: patient._id, isActive: true, role: "patient" },
      add
        ? { $addToSet: { favoriteDoctors: doctorId } }
        : { $pull: { favoriteDoctors: doctorId } },
      { new: true, runValidators: true },
    )
      .select("favoriteDoctors")
      .lean();
    if (!user)
      return res
        .status(401)
        .json({ message: "Session account is unavailable." });
    return res.json({
      doctorIds: (user.favoriteDoctors ?? []).map((id) => id.toString()),
    });
  } catch {
    return res
      .status(500)
      .json({ message: "Unable to update favorites. Please try again." });
  }
}
export async function addFavorite(req: Request, res: Response) {
  return updateFavorite(req, res, true);
}
export async function removeFavorite(req: Request, res: Response) {
  return updateFavorite(req, res, false);
}
