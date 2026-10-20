import express from "express";
import cors from "cors";
import { validateEnv } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

import notificationRoutes from "./routes/notificationRoutes.js";

export const env = validateEnv();

const app = express();
// Default: ignore forwarded client addresses. Configure only verified ingress
// proxy networks; never assume a hop count or trust arbitrary X-Forwarded-For.
app.set(
  "trust proxy",
  env.TRUSTED_PROXY_CIDRS.length ? env.TRUSTED_PROXY_CIDRS : false,
);
app.use(cors({ origin: env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use("/api", healthRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(errorHandler);

export default app;
