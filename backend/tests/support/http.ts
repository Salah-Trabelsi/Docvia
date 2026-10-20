import type { Request, Response } from "express";
import { vi } from "vitest";

// Only the Express surface used by these handlers is stubbed. No listener.
export function request(overrides: Partial<Request> = {}) {
  return {
    method: "GET",
    headers: {},
    params: {},
    body: {},
    ...overrides,
  } as Request;
}

export function response(userId?: string) {
  const stub = {
    locals: { userId, sessionVersion: 0 },
    status: vi.fn(),
    json: vi.fn(),
    set: vi.fn(),
    cookie: vi.fn(),
  };
  stub.status.mockReturnValue(stub);
  stub.json.mockReturnValue(stub);
  stub.set.mockReturnValue(stub);
  return { ...stub, res: stub as unknown as Response };
}

// Minimal awaitable query surface, not an in-memory database emulator.
export function query<T>(value: T) {
  const result = Object.assign(Promise.resolve(value), {
    select: vi.fn(),
    populate: vi.fn(),
    lean: vi.fn().mockResolvedValue(value),
  });
  result.select.mockReturnValue(result);
  result.populate.mockReturnValue(result);
  return result;
}
