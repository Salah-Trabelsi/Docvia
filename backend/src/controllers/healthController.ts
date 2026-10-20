import { Request, Response } from "express";
import mongoose from "mongoose";

let shuttingDown = false;

export function markShuttingDown() {
  shuttingDown = true;
}

export async function readinessCheck(_req: Request, res: Response) {
  res.set("Cache-Control", "no-store");
  try {
    const db = mongoose.connection.db;
    if (shuttingDown || mongoose.connection.readyState !== 1 || !db) {
      res.status(503).json({ status: "not_ready" });
      return;
    }
    await db.command({ ping: 1 }, { timeoutMS: 2000 });
    res.status(shuttingDown ? 503 : 200).json({
      status: shuttingDown ? "not_ready" : "ready",
    });
  } catch {
    res.status(503).json({ status: "not_ready" });
  }
}

export function healthCheck(_req: Request, res: Response) {
  res.json({ status: "ok" });
}
