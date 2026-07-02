import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  message: z.string().min(5).max(5000),
});

/** POST /api/contact — public; stores the message for the support team */
export const createContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const data = contactSchema.parse(req.body);
  await prisma.contactMessage.create({ data });
  res.status(201).json({ success: true });
});

/** GET /api/admin/contact — support/admin inbox */
export const adminListContactMessages = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  res.json(messages);
});

/** PATCH /api/admin/contact/:id/read — toggle read state */
export const adminMarkContactRead = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { isRead } = z.object({ isRead: z.boolean() }).parse(req.body);
  const msg = await prisma.contactMessage.update({ where: { id: req.params.id }, data: { isRead } }).catch(() => null);
  if (!msg) throw new AppError("Message not found.", 404);
  res.json(msg);
});
