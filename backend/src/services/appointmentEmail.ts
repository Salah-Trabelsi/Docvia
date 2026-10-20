import { createHash, randomUUID } from "node:crypto";
import type { ClientSession, Types } from "mongoose";
import { Resend } from "resend";
import { validateEnv } from "../config/env.js";
import { Appointment } from "../models/Appointment.js";
import {
  AppointmentEmailEvent,
  type AppointmentEmailKind,
} from "../models/AppointmentEmailEvent.js";
import { User } from "../models/User.js";
import { Doctor } from "../models/Doctor.js";
import { Notification } from "../models/Notification.js";
import {
  appointmentConfirmationEmail,
  appointmentCancellationEmail,
  appointmentRescheduledEmail,
  appointmentReminderEmail,
} from "../emails/appointmentEmail.js";

import { createAppointmentNotification } from "./notifications.js";
import {
  enqueueDueReminders,
  reminderCatchUpMs,
} from "./appointmentReminders.js";

async function invalidateReminders(
  appointmentId: Types.ObjectId,
  session: ClientSession,
) {
  await AppointmentEmailEvent.updateMany(
    {
      appointmentId,
      kind: "reminder",
      status: { $in: ["pending", "processing"] },
    },
    {
      $set: { status: "skipped", lastError: "appointment_changed" },
      $unset: { leaseToken: 1, leaseUntil: 1 },
    },
    { session },
  );
  await Notification.deleteMany(
    { appointmentId, type: "reminder" },
    { session },
  );
}

export async function enqueueAppointmentEmail(
  appointmentId: Types.ObjectId,
  kind: Extract<AppointmentEmailKind, "confirmation" | "cancellation">,
  session: ClientSession,
) {
  const appointment = await Appointment.findById(appointmentId)
    .select("patientId startsAt endsAt")
    .session(session)
    .lean();
  if (!appointment) throw new Error("Appointment unavailable for notification");
  await AppointmentEmailEvent.updateOne(
    { appointmentId, kind },
    {
      $setOnInsert: {
        appointmentId,
        kind,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
      },
    },
    { upsert: true, session },
  );
  if (kind === "cancellation")
    await invalidateReminders(appointmentId, session);
  await createAppointmentNotification(
    appointment.patientId,
    appointmentId,
    kind,
    `${kind}:${appointmentId}`,
    session,
  );
}

export async function enqueueRescheduledEmail(
  appointmentId: Types.ObjectId,
  changeId: string,
  times: {
    previousStartsAt: Date;
    previousEndsAt: Date;
    startsAt: Date;
    endsAt: Date;
  },
  session: ClientSession,
) {
  await invalidateReminders(appointmentId, session);
  await AppointmentEmailEvent.create(
    [{ appointmentId, kind: "rescheduled", changeId, ...times }],
    { session },
  );
  const appointment = await Appointment.findById(appointmentId)
    .select("patientId")
    .session(session)
    .lean();
  if (!appointment) throw new Error("Appointment unavailable");
  await createAppointmentNotification(
    appointment.patientId,
    appointmentId,
    "rescheduled",
    `rescheduled:${changeId}`,
    session,
  );
}

// Resend retains idempotency keys for 24 hours. Stop before that expires,
// including after a process crash, rather than risk a second delivery.
const retryWindowMs = 23 * 60 * 60_000;
const leaseMs = 2 * 60_000;

async function processNextEmail(resend: Resend): Promise<boolean> {
  const now = new Date();
  const leaseToken = randomUUID();
  const event = await AppointmentEmailEvent.findOneAndUpdate(
    {
      $or: [
        { status: "pending", nextAttemptAt: { $lte: now } },
        { status: "processing", leaseUntil: { $lte: now } },
      ],
    },
    {
      $set: {
        status: "processing",
        leaseToken,
        leaseUntil: new Date(now.getTime() + leaseMs),
      },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { nextAttemptAt: 1, _id: 1 } },
  ).lean();
  if (!event) return false;
  const owned = { _id: event._id, status: "processing", leaseToken };
  const finish = async (
    status: "sent" | "skipped" | "review",
    code?: string,
    providerId?: string,
  ) => {
    await AppointmentEmailEvent.updateOne(owned, {
      $set: {
        status,
        ...(code ? { lastError: code } : {}),
        ...(providerId ? { providerId, sentAt: new Date() } : {}),
      },
      $unset: {
        leaseToken: 1,
        leaseUntil: 1,
        ...(!code ? { lastError: 1 } : {}),
      },
    });
    if (status === "review")
      console.warn("Appointment email requires review", {
        eventId: event._id.toString(),
        code,
      });
  };
  const retry = async (code: string) => {
    if (event.attempts >= 12) {
      await finish("review", "retry_limit");
      return;
    }
    await AppointmentEmailEvent.updateOne(owned, {
      $set: {
        status: "pending",
        lastError: code,
        nextAttemptAt: new Date(
          Date.now() +
            Math.min(60 * 60_000, 30_000 * 2 ** (event.attempts - 1)),
        ),
      },
      $unset: { leaseToken: 1, leaseUntil: 1 },
    });
    console.warn("Appointment email retry queued", {
      eventId: event._id.toString(),
      code,
    });
  };
  try {
    if (
      event.firstSendAt &&
      Date.now() - event.firstSendAt.getTime() >= retryWindowMs
    ) {
      await finish("review", "delivery_uncertain_window_expired");
      return true;
    }
    const appointment = await Appointment.findById(event.appointmentId)
      .select("patientId doctorId startsAt endsAt status rescheduleHistory")
      .lean();
    if (!appointment) {
      await finish("skipped", "appointment_removed");
      return true;
    }
    // Events describe committed transitions, even if cancellation followed a
    // booking before the worker ran. Each transition has its own unique key.
    if (event.kind === "cancellation" && appointment.status !== "cancelled") {
      await finish("skipped", "status_changed");
      return true;
    }
    if (
      event.kind === "rescheduled" &&
      (!event.changeId ||
        !event.previousStartsAt ||
        !event.previousEndsAt ||
        !event.startsAt ||
        !event.endsAt)
    ) {
      await finish("review", "reschedule_snapshot_missing");
      return true;
    }
    const [patient, doctor] = await Promise.all([
      User.findOne({ _id: appointment.patientId, isActive: true })
        .select("firstName email notificationPreferences")
        .lean(),
      Doctor.findById(appointment.doctorId)
        .select(
          "firstName lastName specialty clinic.name clinic.streetAddress clinic.city clinic.postalCode clinic.country",
        )
        .lean(),
    ]);
    if (!patient) {
      await finish("skipped", "patient_unavailable");
      return true;
    }
    if (!doctor) {
      await finish("review", "doctor_unavailable");
      return true;
    }
    if (
      event.kind === "reminder" &&
      (patient.notificationPreferences?.appointmentReminders === false ||
        appointment.status !== "confirmed" ||
        appointment.startsAt.getTime() <= Date.now() ||
        appointment.startsAt.getTime() !== event.startsAt?.getTime() ||
        (appointment.rescheduleHistory?.length ?? 0) !==
          event.scheduleVersion ||
        !event.reminderDueAt ||
        Date.now() - event.reminderDueAt.getTime() > reminderCatchUpMs)
    ) {
      await finish("skipped", "reminder_obsolete_or_disabled");
      return true;
    }
    const env = validateEnv();
    // Legacy confirmation events have no snapshot. The first history entry
    // preserves their original booking times even after multiple reschedules.
    const original =
      event.kind === "confirmation"
        ? appointment.rescheduleHistory?.[0]
        : undefined;
    const details = {
      firstName: patient.firstName,
      doctorName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      specialty: doctor.specialty,
      startsAt:
        event.startsAt ?? original?.previousStartsAt ?? appointment.startsAt,
      endsAt: event.endsAt ?? original?.previousEndsAt ?? appointment.endsAt,
      clinicName: doctor.clinic?.name,
      clinicLocation: [
        doctor.clinic?.streetAddress,
        doctor.clinic?.postalCode,
        doctor.clinic?.city,
        doctor.clinic?.country,
      ]
        .filter(Boolean)
        .join(", "),
      appointmentsUrl: `${env.FRONTEND_URL.replace(/\/$/, "")}/appointments`,
    };
    const payload = {
      from: env.EMAIL_FROM_APPOINTMENTS,
      to: patient.email,
      ...(event.kind === "rescheduled"
        ? appointmentRescheduledEmail({
            ...details,
            previousStartsAt: event.previousStartsAt!,
            previousEndsAt: event.previousEndsAt!,
          })
        : event.kind === "reminder"
          ? appointmentReminderEmail(details)
          : event.kind === "confirmation"
            ? appointmentConfirmationEmail(details)
            : appointmentCancellationEmail(details)),
    };
    // Store only a hash, not recipients, HTML, notes or personal content. A retry
    // must use the exact same payload, even if profiles/config/templates changed.
    const payloadHash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
    if (event.payloadHash && event.payloadHash !== payloadHash) {
      await finish("review", "payload_changed");
      return true;
    }
    const prepared = await AppointmentEmailEvent.updateOne(owned, {
      $set: { payloadHash, firstSendAt: event.firstSendAt ?? new Date() },
    });
    if (!prepared.matchedCount) return true;
    // Recheck immediately before the external call, including on every retry.
    if (event.kind === "reminder") {
      const [current, recipient] = await Promise.all([
        Appointment.findById(event.appointmentId)
          .select("status startsAt rescheduleHistory")
          .lean(),
        User.findOne({ _id: appointment.patientId, isActive: true })
          .select("notificationPreferences")
          .lean(),
      ]);
      if (
        !current ||
        !recipient ||
        recipient.notificationPreferences?.appointmentReminders === false ||
        current.status !== "confirmed" ||
        current.startsAt.getTime() <= Date.now() ||
        current.startsAt.getTime() !== event.startsAt?.getTime() ||
        (current.rescheduleHistory?.length ?? 0) !== event.scheduleVersion ||
        !event.reminderDueAt ||
        Date.now() - event.reminderDueAt.getTime() > reminderCatchUpMs
      ) {
        await finish("skipped", "reminder_obsolete_or_disabled");
        return true;
      }
    }
    const { data, error } = await resend.emails.send(payload, {
      idempotencyKey: `appointment-${event.kind}/${event._id.toString()}`,
      signal: AbortSignal.timeout(20_000),
    });
    if (error || !data?.id) {
      const status = error?.statusCode;
      if (
        status &&
        status >= 400 &&
        status < 500 &&
        status !== 429 &&
        status !== 409
      ) {
        await finish("review", "provider_rejected");
      } else {
        await retry("provider_unavailable_or_uncertain");
      }
    } else {
      await finish("sent", undefined, data.id);
    }
  } catch {
    // Includes provider timeouts and lost acknowledgement writes. If this DB
    // write also fails, the expired lease will recover the same event/key.
    await retry("delivery_or_storage_failure");
  }
  return true;
}

export function startAppointmentEmailWorker() {
  const env = validateEnv();
  if (!env.APPOINTMENT_EMAIL_WORKER_ENABLED) {
    console.info("Appointment email worker paused; events remain queued.");
    return () => Promise.resolve();
  }
  const resend = env.RESEND_API_KEY?.trim()
    ? new Resend(env.RESEND_API_KEY)
    : undefined;
  // This installed SDK logs raw provider errors in development, potentially
  // including recipients. Suppress that instance's logger; use safe codes above.
  if (resend) Object.defineProperty(resend, "logError", { value: () => {} });
  let running = false;
  let stopped = false;
  let inFlight: Promise<void> = Promise.resolve();
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try {
      try {
        await enqueueDueReminders();
      } catch {
        console.warn("Reminder discovery failed; it will retry.");
      }
      for (let count = 0; count < 10 && !stopped && resend; count++) {
        if (!(await processNextEmail(resend))) break;
      }
    } catch {
      console.warn(
        "Appointment email worker could not access its queue; it will retry.",
      );
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => {
    if (!running && !stopped) inFlight = tick();
  }, 15_000);
  timer.unref();
  inFlight = tick();
  return () => {
    stopped = true;
    clearInterval(timer);
    return inFlight;
  };
}
