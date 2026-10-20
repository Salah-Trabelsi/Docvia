import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { request, response, query } from "./support/http.js";
import { login } from "../src/controllers/authController.js";
import { requireAuth } from "../src/middleware/requireAuth.js";
import {
  createAppointment,
  getAppointment,
  cancelAppointment,
  rescheduleAppointment,
} from "../src/controllers/appointmentController.js";

const mocks = vi.hoisted(() => ({
  secret: "unit-test-only-signing-key-not-a-deployment-secret",
  user: { findOne: vi.fn(), findById: vi.fn(), findOneAndUpdate: vi.fn() },
  doctor: { findOneAndUpdate: vi.fn() },
  appointment: {
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    exists: vi.fn(),
    updateMany: vi.fn(),
    create: vi.fn(),
  },
  compare: vi.fn(),
  transaction: vi.fn(),
  slots: vi.fn(),
  bookings: vi.fn(),
  enqueue: vi.fn(),
  rescheduledEmail: vi.fn(),
}));

vi.mock("../src/config/env.js", () => ({
  validateEnv: () => ({
    JWT_SECRET: mocks.secret,
    FRONTEND_URL: "https://docvia.test",
    DOCKER_LOCAL_HTTP: false,
  }),
}));
vi.mock("bcrypt", () => ({ default: { compare: mocks.compare } }));
vi.mock("mongoose", () => ({
  default: { connection: { transaction: mocks.transaction } },
}));
vi.mock("../src/models/User.js", () => ({ User: mocks.user }));
vi.mock("../src/models/Doctor.js", () => ({ Doctor: mocks.doctor }));
vi.mock("../src/models/Appointment.js", () => ({
  Appointment: mocks.appointment,
}));
vi.mock("../src/services/emailVerification.js", () => ({
  hashVerificationToken: () => {
    throw new Error("Not used by these tests");
  },
  sendVerificationEmail: () => {
    throw new Error("Email delivery is forbidden");
  },
}));
vi.mock("../src/services/appointmentEmail.js", () => ({
  enqueueAppointmentEmail: mocks.enqueue,
  enqueueRescheduledEmail: mocks.rescheduledEmail,
}));
vi.mock("../src/services/doctorAvailability.js", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("../src/services/doctorAvailability.js")
    >();
  return {
    ...actual,
    getDoctorSlots: mocks.slots,
    getBookedIntervals: mocks.bookings,
  };
});

const patientA = "aaaaaaaaaaaaaaaaaaaaaaaa";
const patientB = "bbbbbbbbbbbbbbbbbbbbbbbb";
const doctorId = "dddddddddddddddddddddddd";
const appointmentId = "cccccccccccccccccccccccc";
const session = { label: "synthetic-session-no-transaction-guarantees" };
let startAt: string;
let endAt: string;

beforeEach(() => {
  startAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  endAt = new Date(Date.parse(startAt) + 30 * 60_000).toISOString();
  mocks.transaction.mockImplementation(
    async (work: (value: typeof session) => Promise<unknown>) => work(session),
  );
  mocks.user.findOneAndUpdate.mockReturnValue(
    query({ _id: patientA, role: "patient", isEmailVerified: true }),
  );
  mocks.doctor.findOneAndUpdate.mockReturnValue(
    query({ _id: doctorId, isActive: true, acceptingNewPatients: true }),
  );
  mocks.slots.mockReturnValue([{ startAt, endAt }]);
  mocks.bookings.mockResolvedValue([]);
  mocks.enqueue.mockResolvedValue(undefined);
});

describe("authentication middleware and login decisions", () => {
  it("rejects an incorrect password without issuing a cookie", async () => {
    const selectedUser = query({
      passwordHash: "synthetic-hash",
      isActive: true,
    });
    mocks.user.findOne.mockReturnValue(selectedUser);
    mocks.compare.mockResolvedValue(false);
    const out = response();
    await login(
      request({
        body: { email: "patient@example.test", password: "wrong-password" },
      }),
      out.res,
    );
    expect(mocks.user.findOne).toHaveBeenCalledWith({
      email: "patient@example.test",
    });
    expect(selectedUser.select).toHaveBeenCalledWith(
      "+passwordHash +sessionVersion",
    );
    expect(mocks.compare).toHaveBeenCalledWith(
      "wrong-password",
      "synthetic-hash",
    );
    expect(out.status).toHaveBeenCalledWith(401);
    expect(out.json).toHaveBeenCalledWith({
      message: "Invalid credentials or account unavailable.",
    });
    expect(out.cookie).not.toHaveBeenCalled();
  });

  it.each(["invalid", "expired"])("rejects a real %s JWT", async (kind) => {
    const token = jwt.sign(
      { sessionVersion: 0 },
      kind === "invalid" ? "different-test-key" : mocks.secret,
      {
        algorithm: "HS256",
        subject: patientA,
        expiresIn: kind === "expired" ? -60 : 3600,
      },
    );
    const out = response();
    const next = vi.fn();
    await requireAuth(
      request({ headers: { cookie: `token=${token}` } }),
      out.res,
      next,
    );
    expect(out.status).toHaveBeenCalledWith(401);
    expect(out.json).toHaveBeenCalledWith({
      message: "Invalid or expired session.",
    });
    expect(mocks.user.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a revoked sessionVersion with a valid JWT", async () => {
    const token = jwt.sign({ sessionVersion: 0 }, mocks.secret, {
      subject: patientA,
      expiresIn: "1h",
    });
    mocks.user.findById.mockReturnValue(
      query({ isActive: true, sessionVersion: 1 }),
    );
    const out = response();
    const next = vi.fn();
    await requireAuth(
      request({ headers: { cookie: `token=${token}` } }),
      out.res,
      next,
    );
    expect(mocks.user.findById).toHaveBeenCalledWith(patientA);
    expect(out.status).toHaveBeenCalledWith(401);
    expect(out.json).toHaveBeenCalledWith({
      message: "Session is no longer valid. Please sign in again.",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("stops unauthenticated requests before protected functionality", async () => {
    const out = response();
    const next = vi.fn();
    await requireAuth(request(), out.res, next);
    expect(out.status).toHaveBeenCalledWith(401);
    expect(out.json).toHaveBeenCalledWith({
      message: "Authentication required.",
    });
    expect(mocks.user.findById).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});

describe("patient-scoped appointment queries", () => {
  const otherAppointment = { _id: appointmentId, patientId: patientB };

  it("denies A access to B's appointment details using an owner-scoped query", async () => {
    mocks.appointment.updateMany.mockResolvedValue({ modifiedCount: 0 });
    mocks.appointment.findOne.mockReturnValue(query(null));
    const out = response(patientA);
    await getAppointment(
      request({ params: { id: otherAppointment._id } }),
      out.res,
    );
    expect(mocks.appointment.findOne).toHaveBeenCalledWith({
      _id: appointmentId,
      patientId: patientA,
    });
    expect(out.status).toHaveBeenCalledWith(404);
    expect(out.json).toHaveBeenCalledWith({
      message: "Appointment not found.",
    });
  });

  it("denies A cancellation of B's appointment without enqueuing email", async () => {
    mocks.appointment.findOneAndUpdate.mockReturnValue(query(null));
    mocks.appointment.exists.mockResolvedValue(null);
    const out = response(patientA);
    await cancelAppointment(
      request({ params: { id: otherAppointment._id } }),
      out.res,
    );
    expect(mocks.appointment.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: appointmentId,
        patientId: patientA,
        status: "confirmed",
      }),
      { $set: { status: "cancelled" } },
      expect.objectContaining({ session }),
    );
    expect(mocks.appointment.exists).toHaveBeenCalledWith({
      _id: appointmentId,
      patientId: patientA,
    });
    expect(out.status).toHaveBeenCalledWith(404);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it("denies A rescheduling of B's appointment before transaction work", async () => {
    mocks.appointment.findOne.mockReturnValue(query(null));
    const out = response(patientA);
    await rescheduleAppointment(
      request({
        params: { id: otherAppointment._id },
        body: { startsAt: startAt },
      }),
      out.res,
    );
    expect(mocks.appointment.findOne).toHaveBeenCalledWith({
      _id: appointmentId,
      patientId: patientA,
    });
    expect(out.status).toHaveBeenCalledWith(404);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.rescheduledEmail).not.toHaveBeenCalled();
  });

  it("rejects an unverified patient before reserving a doctor slot", async () => {
    mocks.user.findOneAndUpdate.mockReturnValue(
      query({ _id: patientA, role: "patient", isEmailVerified: false }),
    );
    const out = response(patientA);
    await createAppointment(
      request({ body: { doctorId, startsAt: startAt } }),
      out.res,
    );
    expect(out.status).toHaveBeenCalledWith(403);
    expect(out.json).toHaveBeenCalledWith({
      message: "Verify your email before booking an appointment.",
    });
    expect(mocks.doctor.findOneAndUpdate).not.toHaveBeenCalled();
    expect(mocks.appointment.create).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });
});

describe("booking input and response handling", () => {
  it("rejects invalid booking input before transaction work", async () => {
    const out = response(patientA);
    await createAppointment(
      request({
        body: {
          doctorId: "not-an-object-id",
          startsAt: "not-a-date",
          patientId: patientB,
        },
      }),
      out.res,
    );
    expect(out.status).toHaveBeenCalledWith(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.appointment.create).not.toHaveBeenCalled();
  });

  it("returns the established conflict response for an occupied slot", async () => {
    mocks.bookings.mockResolvedValue([
      { startsAt: new Date(startAt), endsAt: new Date(endAt) },
    ]);
    const out = response(patientA);
    await createAppointment(
      request({ body: { doctorId, startsAt: startAt } }),
      out.res,
    );
    expect(out.status).toHaveBeenCalledWith(409);
    expect(out.json).toHaveBeenCalledWith({
      message: "This appointment time is already booked. Choose another time.",
    });
    expect(mocks.appointment.create).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it("returns the expected 201 response and notification request for a mocked booking", async () => {
    const appointment = {
      _id: appointmentId,
      doctorId,
      patientId: patientA,
      startsAt: new Date(startAt),
      endsAt: new Date(endAt),
      status: "confirmed",
      notes: "Synthetic note",
    };
    mocks.appointment.create.mockResolvedValue([appointment]);
    const out = response(patientA);
    await createAppointment(
      request({
        body: { doctorId, startsAt: startAt, notes: "Synthetic note" },
      }),
      out.res,
    );
    expect(mocks.user.findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ _id: patientA, isActive: true }),
      { $inc: { __v: 1 } },
      expect.objectContaining({ session }),
    );
    expect(mocks.appointment.create).toHaveBeenCalledWith(
      [
        {
          patientId: patientA,
          doctorId,
          startsAt: new Date(startAt),
          endsAt: new Date(endAt),
          status: "confirmed",
          notes: "Synthetic note",
        },
      ],
      { session },
    );
    expect(mocks.enqueue).toHaveBeenCalledExactlyOnceWith(
      appointmentId,
      "confirmation",
      session,
    );
    expect(out.status).toHaveBeenCalledWith(201);
    expect(out.json).toHaveBeenCalledWith({
      _id: appointmentId,
      doctorId,
      startsAt: new Date(startAt),
      endsAt: new Date(endAt),
      status: "confirmed",
      notes: "Synthetic note",
    });
  });
});
