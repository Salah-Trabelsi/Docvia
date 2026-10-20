import { Router } from "express";
import { requireAuth, protectCsrf } from "../middleware/requireAuth.js";
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
const router = Router();
router.use(requireAuth);
router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/read-all", protectCsrf, markAllRead);
router.patch("/:id/read", protectCsrf, markRead);
export default router;
