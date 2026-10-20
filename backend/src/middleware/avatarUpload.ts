import type { Request, Response, NextFunction } from "express";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1, fields: 0, parts: 2 },
}).single("avatar");

export function avatarUpload(req: Request, res: Response, next: NextFunction) {
  upload(req, res, (error: unknown) => {
    if (error) {
      const tooLarge =
        error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE";
      res.status(tooLarge ? 413 : 400).json({
        message: tooLarge
          ? "Avatar must not exceed 2 MB."
          : "Send one image using the avatar file field.",
      });
      return;
    }
    if (!req.file?.buffer.length) {
      res.status(400).json({ message: "An avatar image is required." });
      return;
    }
    next();
  });
}
