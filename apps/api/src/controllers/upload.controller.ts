import { Response } from "express";
import asyncHandler from "express-async-handler";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { uploadBuffer } from "@/services/storage.service";

/** POST /api/admin/upload — admin uploads an image file, gets back a URL to store. */
export const uploadImage = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const file = (req as AuthedRequest & { file?: Express.Multer.File }).file;
  if (!file) throw new AppError("No image file was provided.", 400);
  if (!file.mimetype.startsWith("image/")) throw new AppError("Only image files are allowed.", 400);

  const url = await uploadBuffer({ buffer: file.buffer, mimeType: file.mimetype, folder: "products" });
  res.json({ url });
});
