import app from "./app.js";
import { connectDB } from "./config/db.js";
import { Appointment } from "./models/Appointment.js";
import { ensureAppointmentEmailIndexes } from "./models/AppointmentEmailEvent.js";
import { startAppointmentEmailWorker } from "./services/appointmentEmail.js";

import { Notification } from "./models/Notification.js";
import mongoose from "mongoose";
import type { Server } from "node:http";
import { markShuttingDown } from "./controllers/healthController.js";

const PORT = process.env.PORT || 3000;
let server: Server | undefined;
let stopEmailWorker = () => Promise.resolve();
let shuttingDown = false;

async function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  markShuttingDown();
  // Stay below Render's default termination grace period. An interrupted outbox
  // event retains its durable lease/idempotency key for recovery on restart.
  const deadline = setTimeout(() => {
    console.error("Shutdown deadline exceeded.");
    server?.closeAllConnections();
    process.exit(1);
  }, 25_000);
  try {
    const workerDrained = stopEmailWorker();
    const httpDrained = new Promise<void>((resolve) => {
      if (!server?.listening) {
        resolve();
        return;
      }

      server.close(() => resolve());
      server.closeIdleConnections();
    });
    await Promise.all([workerDrained, httpDrained]);
    await mongoose.disconnect();
    clearTimeout(deadline);
    process.exit(exitCode);
  } catch {
    console.error("Shutdown could not complete.");
    process.exit(1);
  }
}

process.once("SIGTERM", () => {
  void shutdown();
});
process.once("SIGINT", () => {
  void shutdown();
});

async function startServer() {
  try {
    await connectDB();
    // Do not accept bookings until the database uniqueness constraint exists.
    await Appointment.createIndexes();
    await Notification.createIndexes();
    await ensureAppointmentEmailIndexes();
    if (shuttingDown) return;

    console.log("MongoDB connected successfully");

    server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      if (!shuttingDown) stopEmailWorker = startAppointmentEmailWorker();
    });
    server.on("error", () => {
      console.error("HTTP server failure.");
      void shutdown(1);
    });
  } catch {
    console.error(
      "Server startup failed; check configuration, database access and indexes.",
    );
    await shutdown(1);
  }
}

startServer();
