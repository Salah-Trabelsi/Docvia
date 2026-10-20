import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if ("type" in err && err.type === "entity.parse.failed") {
    res.status(400).json({ message: "Invalid JSON request body." });
    return;
  }
  // Raw errors can contain connection details, request data or provider payloads.
  console.error("Unhandled request failure.");
  if (res.headersSent) {
    res.end();
    return;
  }
  res.status(500).json({ message: "Internal server error" });
}
