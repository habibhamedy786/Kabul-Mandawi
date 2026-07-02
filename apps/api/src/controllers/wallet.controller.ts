import { Response } from "express";
import asyncHandler from "express-async-handler";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";

/** GET /api/wallet/mine — wallet hold + refund history for the logged-in customer */
export const getMyWalletOverview = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.sub },
    select: {
      id: true, orderNumber: true, status: true, walletStatus: true, totalUsd: true, createdAt: true,
      walletHold: true, refund: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const held = orders.filter((o) => o.walletStatus === "HELD");
  const released = orders.filter((o) => o.walletStatus === "RELEASED");
  const refunds = orders.filter((o) => o.refund);

  res.json({ held, released, refunds, orders });
});
