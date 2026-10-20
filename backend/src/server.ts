import app from "./app.js";
import { connectDB } from "./config/db.js";
import { Appointment } from "./models/Appointment.js";
import { ensureAppointmentEmailIndexes } from "./models/AppointmentEmailEvent.js";
import { startAppointmentEmailWorker } from "./services/appointmentEmail.js";

import { Notification } from "./models/Notification.js";

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await connectDB();
    // Do not accept bookings until the database uniqueness constraint exists.
    await Appointment.createIndexes();
    await Notification.createIndexes();
    await ensureAppointmentEmailIndexes();

    console.log("MongoDB connected successfully");

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      const stopEmailWorker = startAppointmentEmailWorker();
      server.once("close", stopEmailWorker);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
}

startServer();
