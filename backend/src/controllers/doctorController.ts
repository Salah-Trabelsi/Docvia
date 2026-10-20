import { Request, Response, NextFunction } from "express";
import { Doctor } from "../models/Doctor.js";

export async function getDoctors(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const doctors = await Doctor.find({ isActive: true }).sort({
      ratingAverage: -1,
    });
    res.json(doctors);
  } catch (error) {
    next(error);
  }
}

export async function getDoctorBySlug(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const doctor = await Doctor.findOne({
      slug: req.params.slug,
      isActive: true,
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (error) {
    next(error);
  }
}
