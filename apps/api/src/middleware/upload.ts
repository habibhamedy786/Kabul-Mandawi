import multer from "multer";

// Files are buffered in memory then streamed to S3/R2 (see storage.service.ts).
// Limits: 8MB per file, max 6 files per request (delivery photos + signature).
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Unsupported file type. Use JPEG, PNG, WEBP or HEIC."));
  },
});
