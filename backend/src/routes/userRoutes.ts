import { Router } from "express";
import { getProfile, updateProfile } from "../controllers/userController.js";
import { requireAuth, protectCsrf } from "../middleware/requireAuth.js";
import { avatarUpload } from "../middleware/avatarUpload.js";
import { uploadAvatar } from "../controllers/avatarController.js";
import { changePassword } from "../controllers/changePasswordController.js";
import { verificationRateLimit } from "../middleware/verificationRateLimit.js";
import { requestEmailChange } from "../controllers/emailChangeController.js";
import { deleteAccount } from "../controllers/deleteAccountController.js";
import { avatarRateLimit } from "../middleware/abuseProtection.js";
import { withAvatarCapacity } from "../middleware/avatarCapacity.js";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../controllers/notificationPreferencesController.js";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/favoritesController.js";

const router = Router();
router.use(requireAuth);
router.get("/me/favorites", getFavorites);
router.post("/me/favorites/:doctorId", protectCsrf, addFavorite);
router.delete("/me/favorites/:doctorId", protectCsrf, removeFavorite);
router.get("/me/notification-preferences", getNotificationPreferences);
router.patch(
  "/me/notification-preferences",
  protectCsrf,
  updateNotificationPreferences,
);
router.get("/me", getProfile);
router.patch("/me", updateProfile);
router.delete("/me", verificationRateLimit(), protectCsrf, deleteAccount);
router.post(
  "/me/avatar",
  avatarRateLimit,
  withAvatarCapacity(avatarUpload, uploadAvatar),
);
router.post(
  "/me/change-password",
  verificationRateLimit(),
  protectCsrf,
  changePassword,
);
router.post(
  "/me/request-email-change",
  verificationRateLimit(),
  protectCsrf,
  requestEmailChange,
);
export default router;
