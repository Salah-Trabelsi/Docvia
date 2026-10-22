import { expect, it, vi } from "vitest";
import { createAppointment } from "../src/controllers/appointmentController.js";
import { query, request, response } from "./support/http.js";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  user: { findOneAndUpdate: vi.fn() },
  doctor: { findOneAndUpdate: vi.fn() },
  appointment: { create: vi.fn() },
  slots: vi.fn(),
  bookings: vi.fn(),
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
  enqueueAppointmentEmail: mocks.enqueue,
  enqueueRescheduledEmail: vi.fn(),
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

it("rejects a future start that is not a generated calendar slot without creating a booking", async () => {
  const patientId = "aaaaaaaaaaaaaaaaaaaaaaaa";
  const doctorId = "dddddddddddddddddddddddd";
  const session = { label: "mock-session-no-database" };
  mocks.transaction.mockImplementation(
    async (work: (value: typeof session) => Promise<unknown>) => work(session),
  );
  mocks.user.findOneAndUpdate.mockReturnValue(
    query({ _id: patientId, role: "patient", isEmailVerified: true }),
  );
  mocks.doctor.findOneAndUpdate.mockReturnValue(
    query({ _id: doctorId, isActive: true, acceptingNewPatients: true }),
  );
  mocks.slots.mockReturnValue([]);
  const out = response(patientId);
  await createAppointment(
    request({
      body: {
        doctorId,
        startsAt: new Date(Date.now() + 7 * 86_400_000).toISOString(),
      },
    }),
    out.res,
  );
  expect(mocks.slots).toHaveBeenCalledOnce();
  expect(out.status).toHaveBeenCalledWith(400);
  expect(out.json).toHaveBeenCalledWith({
    message: "Choose an available appointment time from the doctor calendar.",
  });
  expect(mocks.bookings).not.toHaveBeenCalled();
  expect(mocks.appointment.create).not.toHaveBeenCalled();
  expect(mocks.enqueue).not.toHaveBeenCalled();
});
