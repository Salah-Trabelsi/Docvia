import jwt from "jsonwebtoken";
import { expect, it, vi } from "vitest";
import { login } from "../src/controllers/authController.js";
import { requireAuth } from "../src/middleware/requireAuth.js";
import { query, request, response } from "./support/http.js";

const mocks = vi.hoisted(() => ({
  secret: "synthetic-auth-test-secret-not-for-deployment",
  user: { findOne: vi.fn(), findById: vi.fn() },
  compare: vi.fn(),
}));

vi.mock("../src/config/env.js", () => ({
  validateEnv: () => ({
    JWT_SECRET: mocks.secret,
    FRONTEND_URL: "https://docvia.test",
    DOCKER_LOCAL_HTTP: false,
  }),
}));
vi.mock("../src/models/User.js", () => ({ User: mocks.user }));
vi.mock("bcrypt", () => ({ default: { compare: mocks.compare } }));
vi.mock("../src/services/emailVerification.js", () => ({
  hashVerificationToken: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

it("rejects an inactive account at login and when validating an existing session", async () => {
  const patientId = "aaaaaaaaaaaaaaaaaaaaaaaa";
  mocks.user.findOne.mockReturnValue(
    query({ passwordHash: "synthetic-hash", isActive: false }),
  );
  mocks.compare.mockResolvedValue(true);
  const loginResponse = response();
  await login(
    request({
      body: { email: "inactive@example.test", password: "synthetic-password" },
    }),
    loginResponse.res,
  );
  expect(mocks.compare).toHaveBeenCalledWith(
    "synthetic-password",
    "synthetic-hash",
  );
  expect(loginResponse.status).toHaveBeenCalledWith(401);
  expect(loginResponse.json).toHaveBeenCalledWith({
    message: "Invalid credentials or account unavailable.",
  });
  expect(loginResponse.cookie).not.toHaveBeenCalled();

  const token = jwt.sign({ sessionVersion: 0 }, mocks.secret, {
    subject: patientId,
    expiresIn: "1h",
    algorithm: "HS256",
  });
  mocks.user.findById.mockReturnValue(
    query({ isActive: false, sessionVersion: 0 }),
  );
  const sessionResponse = response();
  const next = vi.fn();
  await requireAuth(
    request({ headers: { cookie: `token=${token}` } }),
    sessionResponse.res,
    next,
  );
  expect(mocks.user.findById).toHaveBeenCalledWith(patientId);
  expect(sessionResponse.status).toHaveBeenCalledWith(401);
  expect(sessionResponse.json).toHaveBeenCalledWith({
    message: "Session is no longer valid. Please sign in again.",
  });
  expect(next).not.toHaveBeenCalled();
});
