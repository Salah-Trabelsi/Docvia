import { Router } from "express";
import {
  login,
  register,
  resendVerification,
  verifyEmail,
} from "../controllers/authController.js";
import { verificationRateLimit } from "../middleware/verificationRateLimit.js";
import { getMe, logout } from "../controllers/sessionController.js";
import { protectCsrf, requireAuth } from "../middleware/requireAuth.js";
import {
  forgotPassword,
  resetPassword,
} from "../controllers/passwordResetController.js";
import { confirmEmailChange } from "../controllers/emailChangeController.js";
import {
  loginRateLimit,
  registrationRateLimit,
} from "../middleware/abuseProtection.js";

const router = Router();
router.post("/register", registrationRateLimit, protectCsrf, register);
router.post("/login", loginRateLimit, protectCsrf, login);
router.get("/me", requireAuth, getMe);
router.post("/logout", protectCsrf, logout);
router.post("/verify-email", verificationRateLimit(), protectCsrf, verifyEmail);
router.post(
  "/resend-verification",
  verificationRateLimit(),
  protectCsrf,
  resendVerification,
);
router.post(
  "/forgot-password",
  verificationRateLimit(),
  protectCsrf,
  forgotPassword,
);
router.post(
  "/reset-password",
  verificationRateLimit(),
  protectCsrf,
  resetPassword,
);
router.post(
  "/confirm-email-change",
  verificationRateLimit(),
  protectCsrf,
  confirmEmailChange,
);
export default router;
