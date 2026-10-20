import { Router } from "express";
import { requireAuth, protectCsrf } from "../middleware/requireAuth.js";
import { verificationRateLimit } from "../middleware/verificationRateLimit.js";
import {
  createAppointment,
  getMyAppointments,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from "../controllers/appointmentController.js";

const router = Router();
router.use(requireAuth);
router.post("/", verificationRateLimit(), protectCsrf, createAppointment);
router.get("/me", getMyAppointments);
router.get("/:id", getAppointment);
router.patch("/:id/cancel", protectCsrf, cancelAppointment);
router.patch(
  "/:id/reschedule",
  verificationRateLimit(),
  protectCsrf,
  rescheduleAppointment,
);
export default router;
