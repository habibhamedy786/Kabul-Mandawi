import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import * as walletService from "@/services/wallet.service";

/** GET /api/admin/refunds — Admin/Support queue of pending + processed refunds */
export const adminListRefunds = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const refunds = await prisma.refund.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    include: { order: { include: { user: { select: { fullName: true, email: true } } } } },
  });
  res.json(refunds);
});

const requestSchema = z.object({ reason: z.string().min(3) });

/** POST /api/admin/orders/:id/refund-request — staff flags delivery as not completable */
export const adminRequestRefund = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { reason } = requestSchema.parse(req.body);
  await walletService.requestRefund(req.params.id, reason, req.user!.sub);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  res.json(order);
});

/** POST /api/admin/orders/:id/refund-process — Admin/Super Admin issues the actual Stripe refund */
export const adminProcessRefund = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await walletService.processRefund(req.params.id, req.user!.sub);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  res.json(order);
});
