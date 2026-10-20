import type { Request, RequestHandler, Response } from "express";
import { rejectAbuse } from "./abuseProtection.js";

// Reserve capacity before buffering multipart input, and retain it until all
// processing/cleanup finishes, even if the browser disconnects during Sharp.
export function withAvatarCapacity(
  upload: RequestHandler,
  handle: (req: Request, res: Response) => Promise<void>,
): RequestHandler {
  let active = 0;
  return (req, res, next) => {
    if (active >= 2) {
      rejectAbuse(res, 5);
      return;
    }
    active++;
    let processing = false;
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      active--;
      res.off("finish", onResponseEnd);
      res.off("close", onResponseEnd);
    };
    const onResponseEnd = () => {
      if (!processing) release();
    };
    res.once("finish", onResponseEnd);
    res.once("close", onResponseEnd);
    try {
      upload(req, res, (error?: unknown) => {
        if (error) {
          release();
          next(error);
          return;
        }
        if (released || req.aborted || res.destroyed) {
          release();
          return;
        }
        processing = true;
        void handle(req, res).catch(next).finally(release);
      });
    } catch (error) {
      release();
      next(error);
    }
  };
}
