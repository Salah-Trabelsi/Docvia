import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { validateEnv } from "../config/env.js";
import { User } from "../models/User.js";

// Reuse on cookie-authenticated mutations. Missing origins fail closed;
// Referer is a fallback for clients that omit Origin.
export function protectCsrf(req: Request, res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("Origin");
  const referer = req.get("Referer");
  const trustedOrigin = new URL(validateEnv().FRONTEND_URL).origin;
  let requestOrigin: string | undefined;
  try {
    requestOrigin = origin ?? (referer ? new URL(referer).origin : undefined);
  } catch {
    // Malformed Referer is rejected below.
  }

  if (requestOrigin !== trustedOrigin) {
    res.status(403).json({ message: "Request origin is not allowed." });
    return;
  }
  next();
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.set("Cache-Control", "no-store");
  const { JWT_SECRET } = validateEnv();
  let userId: string;
  let sessionVersion: number;
  try {
    const cookie = req.headers.cookie
      ?.split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("token="));
    const token = cookie
      ? decodeURIComponent(cookie.slice("token=".length))
      : undefined;
    if (!token) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !/^[a-f\d]{24}$/i.test(payload.sub) ||
      typeof payload.exp !== "number"
    ) {
      res.status(401).json({ message: "Invalid session." });
      return;
    }
    // Previously issued tokens have version zero until the first reset.
    const version: unknown = payload.sessionVersion ?? 0;
    if (
      typeof version !== "number" ||
      !Number.isSafeInteger(version) ||
      version < 0
    ) {
      res.status(401).json({ message: "Invalid session." });
      return;
    }
    userId = payload.sub;
    sessionVersion = version;
  } catch {
    res.status(401).json({ message: "Invalid or expired session." });
    return;
  }

  try {
    const user = await User.findById(userId)
      .select("isActive +sessionVersion")
      .lean();
    if (
      !user ||
      !user.isActive ||
      (user.sessionVersion ?? 0) !== sessionVersion
    ) {
      res
        .status(401)
        .json({ message: "Session is no longer valid. Please sign in again." });
      return;
    }
    res.locals.userId = userId;
    res.locals.sessionVersion = sessionVersion;
  } catch {
    res
      .status(500)
      .json({ message: "Unable to validate session. Please try again later." });
    return;
  }
  protectCsrf(req, res, next);
}
