import { expect, it, vi } from "vitest";
import { rescheduleAppointment } from "../src/controllers/appointmentController.js";
import { query, request, response } from "./support/http.js";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  user: { findOneAndUpdate: vi.fn() },
  doctor: { findOneAndUpdate: vi.fn() },
  appointment: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
  enqueue: vi.fn(),
}));

vi.mock("mongoose", () => ({
  default: { connection: { transaction: mocks.transaction } },
}));
vi.mock("../src/models/User.js", () => ({ User: mocks.user }));
vi.mock("../src/models/Doctor.js", () => ({ Doctor: mocks.doctor }));
vi.mock("../src/models/Appointment.js", () => ({
  Appointment: mocks.appointment,
}));
vi.mock("../src/services/appointmentEmail.js", () => ({
  enqueueAppointmentEmail: vi.fn(),
  enqueueRescheduledEmail: mocks.enqueue,
}));
vi.mock("../src/services/doctorAvailability.js", () => ({
  doctorLocalDate: vi.fn(),
  getDoctorSlots: vi.fn(),
  getBookedIntervals: vi.fn(),
  excludeBookedSlots: vi.fn(),
}));

it("rejects status overrides and refuses to reschedule an owner's cancelled appointment", async () => {
  const patientId = "aaaaaaaaaaaaaaaaaaaaaaaa";
  const appointmentId = "cccccccccccccccccccccccc";
  const startsAt = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const invalid = response(patientId);
  await rescheduleAppointment(
    request({
      params: { id: appointmentId },
      body: { startsAt, status: "confirmed" },
    }),
    invalid.res,
  );
  expect(invalid.status).toHaveBeenCalledWith(400);
  expect(invalid.json).toHaveBeenCalledWith({
    message: "Provide only a valid ISO startsAt timestamp.",
  });
  expect(mocks.appointment.findOne).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();

  const session = { label: "mock-session-no-database" };
  mocks.transaction.mockImplementation(
    async (work: (value: typeof session) => Promise<unknown>) => work(session),
  );
  mocks.user.findOneAndUpdate.mockReturnValue(
    query({ _id: patientId, role: "patient", isEmailVerified: true }),
  );
  const appointment = {
    _id: appointmentId,
    patientId,
    status: "cancelled",
    startsAt: new Date(Date.now() + 86_400_000),
  };
  const current = Object.assign(query(appointment), { session: vi.fn() });
  current.session.mockReturnValue(current);
  mocks.appointment.findOne
    .mockReturnValueOnce(query(appointment))
    .mockReturnValueOnce(current);
  const out = response(patientId);
  await rescheduleAppointment(
    request({ params: { id: appointmentId }, body: { startsAt } }),
    out.res,
  );
  expect(mocks.appointment.findOne).toHaveBeenNthCalledWith(1, {
    _id: appointmentId,
    patientId,
  });
  expect(mocks.appointment.findOne).toHaveBeenNthCalledWith(2, {
    _id: appointmentId,
    patientId,
  });
  expect(current.session).toHaveBeenCalledWith(session);
  expect(out.status).toHaveBeenCalledWith(409);
  expect(out.json).toHaveBeenCalledWith({
    message: "Only confirmed future appointments can be rescheduled.",
  });
  expect(mocks.doctor.findOneAndUpdate).not.toHaveBeenCalled();
  expect(mocks.appointment.findOneAndUpdate).not.toHaveBeenCalled();
  expect(mocks.enqueue).not.toHaveBeenCalled();
});
