import type { Express } from "express";
import express from "express";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

export function serveFrontend(app: Express) {
  const directory = fileURLToPath(new URL("../../public/", import.meta.url));
  const index = join(directory, "index.html");
  if (!existsSync(index)) {
    throw new Error(
      "Combined frontend serving requires compiled public/index.html.",
    );
  }

  // Never turn unknown API routes (including non-GET requests) into HTML.
  app.use("/api", (_req, res) => {
    res.status(404).json({ message: "API endpoint not found." });
  });
  app.use(express.static(directory, { index: false, maxAge: 0 }));
  app.get("*", (req, res, next) => {
    // Missing scripts/images should be 404, not a successful HTML response.
    if (extname(req.path) || !req.accepts("html")) {
      next();
      return;
    }
    res.set("Cache-Control", "no-store");
    res.sendFile(index);
  });
}
