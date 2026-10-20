import { createHmac, randomBytes } from "node:crypto";
import type { Request, RequestHandler, Response } from "express";

type Rule = {
  limit: number;
  windowMs: number;
  key: (req: Request, res: Response) => string | undefined;
};

const minute = 60_000;
// Ephemeral keyed hashes avoid retaining raw email addresses in counters.
const keySecret = randomBytes(32);
const ipKey = (req: Request) => req.ip ?? req.socket.remoteAddress ?? "unknown";
const accountKey = (req: Request) => {
  const email: unknown = req.body?.email;
  if (typeof email !== "string" || email.length > 1024) return undefined;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return createHmac("sha256", keySecret).update(normalized).digest("hex");
};

export function rejectAbuse(res: Response, retrySeconds: number) {
  res.set("Cache-Control", "no-store");
  res.set("Retry-After", String(Math.max(1, Math.ceil(retrySeconds))));
  res
    .status(429)
    .json({ message: "Too many requests. Please try again later." });
}

// Fixed windows start on the first attempt. Rejections never extend a window.
// Per-process only: use one instance until a shared limiter is deployed.
function rateLimit(rules: Rule[]): RequestHandler {
  const buckets = rules.map(
    () => new Map<string, { count: number; resetAt: number }>(),
  );
  let nextSweep = 0;
  return (req, res, next) => {
    const now = Date.now();
    if (now >= nextSweep) {
      for (const bucket of buckets) {
        for (const [key, entry] of bucket) {
          if (entry.resetAt <= now) bucket.delete(key);
        }
      }
      nextSweep = now + minute;
    }
    // Process the IP rule first so blocked IPs cannot fill account counters.
    for (const [index, rule] of rules.entries()) {
      const key = rule.key(req, res);
      if (key === undefined) continue;
      const bucket = buckets[index];
      let entry = bucket.get(key);
      if (entry && entry.resetAt <= now) {
        bucket.delete(key);
        entry = undefined;
      }
      if (entry && entry.count >= rule.limit) {
        rejectAbuse(res, (entry.resetAt - now) / 1000);
        return;
      }
      // Fail closed rather than allowing unbounded memory growth.
      if (!entry && bucket.size >= 10_000) {
        rejectAbuse(res, (nextSweep - now) / 1000);
        return;
      }
      bucket.set(key, {
        count: (entry?.count ?? 0) + 1,
        resetAt: entry?.resetAt ?? now + rule.windowMs,
      });
    }
    res.set("Cache-Control", "no-store");
    next();
  };
}

export const loginRateLimit = rateLimit([
  { key: ipKey, limit: 30, windowMs: 15 * minute },
  { key: accountKey, limit: 10, windowMs: 15 * minute },
]);

export const registrationRateLimit = rateLimit([
  { key: ipKey, limit: 5, windowMs: 60 * minute },
  { key: accountKey, limit: 3, windowMs: 60 * minute },
]);

export const avatarRateLimit = rateLimit([
  { key: ipKey, limit: 20, windowMs: 15 * minute },
  { key: (_req, res) => res.locals.userId, limit: 5, windowMs: 15 * minute },
]);
