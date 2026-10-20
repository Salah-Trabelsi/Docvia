import { Router } from "express";
import {
  getDoctors,
  getDoctorBySlug,
} from "../controllers/doctorController.js";
import {
  getDoctorAvailability,
  getDoctorCalendar,
  getDoctorAvailabilitySummary,
} from "../controllers/doctorAvailabilityController.js";

const router = Router();
router.get("/", getDoctors);
router.get("/availability-summary", getDoctorAvailabilitySummary);
router.get("/:slug/availability", getDoctorAvailability);
router.get("/:slug/calendar", getDoctorCalendar);
router.get("/:slug", getDoctorBySlug);
export default router;
