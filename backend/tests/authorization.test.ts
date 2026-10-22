import { expect, it, vi } from "vitest";
import {
  getProfile,
  updateProfile,
} from "../src/controllers/userController.js";
import { query, request, response } from "./support/http.js";

const mocks = vi.hoisted(() => ({
  user: { findOne: vi.fn(), findOneAndUpdate: vi.fn() },
}));
vi.mock("../src/models/User.js", () => ({ User: mocks.user }));

it("scopes profiles to the authenticated patient and rejects client-supplied identity or role changes", async () => {
  const patientId = "aaaaaaaaaaaaaaaaaaaaaaaa";
  const otherPatientId = "bbbbbbbbbbbbbbbbbbbbbbbb";
  const profile = {
    _id: patientId,
    firstName: "Fictional",
    lastName: "Patient",
    email: "fictional@example.test",
    role: "patient",
  };
  mocks.user.findOne.mockReturnValue(query(profile));
  const out = response(patientId);
  await getProfile(
    request({
      params: { id: otherPatientId },
      body: { userId: otherPatientId },
    }),
    out.res,
  );
  expect(mocks.user.findOne).toHaveBeenCalledExactlyOnceWith({
    _id: patientId,
    isActive: true,
  });
  expect(out.json).toHaveBeenCalledWith(profile);

  for (const body of [{ role: "admin" }, { userId: otherPatientId }]) {
    const update = response(patientId);
    await updateProfile(request({ body }), update.res);
    expect(update.status).toHaveBeenCalledWith(400);
    expect(update.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Invalid profile details." }),
    );
  }
  expect(mocks.user.findOneAndUpdate).not.toHaveBeenCalled();
});
