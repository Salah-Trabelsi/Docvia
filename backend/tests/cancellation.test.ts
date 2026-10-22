import { expect, it, vi } from "vitest";
import { cancelAppointment } from "../src/controllers/appointmentController.js";
import { query, request, response } from "./support/http.js";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  appointment: { findOneAndUpdate: vi.fn(), exists: vi.fn() },
  enqueue: vi.fn(),
}));

vi.mock("mongoose", () => ({
  default: { connection: { transaction: mocks.transaction } },
}));
vi.mock("../src/models/User.js", () => ({ User: {} }));
vi.mock("../src/models/Doctor.js", () => ({ Doctor: {} }));
vi.mock("../src/models/Appointment.js", () => ({
  Appointment: mocks.appointment,
}));
vi.mock("../src/services/appointmentEmail.js", () => ({
  enqueueAppointmentEmail: mocks.enqueue,
  enqueueRescheduledEmail: vi.fn(),
}));
vi.mock("../src/services/doctorAvailability.js", () => ({
  doctorLocalDate: vi.fn(),
  getDoctorSlots: vi.fn(),
  getBookedIntervals: vi.fn(),
  excludeBookedSlots: vi.fn(),
}));

it("returns a conflict for an owned but ineligible appointment without enqueueing cancellation email", async () => {
  const patientId = "aaaaaaaaaaaaaaaaaaaaaaaa";
  const appointmentId = "cccccccccccccccccccccccc";
  const session = { label: "mock-session-no-database" };
  mocks.transaction.mockImplementation(
    async (work: (value: typeof session) => Promise<unknown>) => work(session),
  );
  // The database reports that the conditional update did not match, but the
  // appointment exists for this owner. This does not simulate Mongo filtering.
  mocks.appointment.findOneAndUpdate.mockReturnValue(query(null));
  mocks.appointment.exists.mockResolvedValue({ _id: appointmentId });
  const out = response(patientId);
  const before = Date.now();
  await cancelAppointment(request({ params: { id: appointmentId } }), out.res);
  const after = Date.now();
  expect(mocks.appointment.findOneAndUpdate).toHaveBeenCalledWith(
    {
      _id: appointmentId,
      patientId,
      status: "confirmed",
      startsAt: { $gt: expect.any(Date) },
    },
    { $set: { status: "cancelled" } },
    { new: true, runValidators: true, session },
  );
  const cutoff: Date =
    mocks.appointment.findOneAndUpdate.mock.calls[0][0].startsAt.$gt;
  expect(cutoff.getTime()).toBeGreaterThanOrEqual(before);
  expect(cutoff.getTime()).toBeLessThanOrEqual(after);
  expect(mocks.appointment.exists).toHaveBeenCalledWith({
    _id: appointmentId,
    patientId,
  });
  expect(out.status).toHaveBeenCalledWith(409);
  expect(out.json).toHaveBeenCalledWith({
    message: "Only confirmed future appointments can be cancelled.",
  });
  expect(mocks.enqueue).not.toHaveBeenCalled();
});
