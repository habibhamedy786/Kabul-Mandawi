import { Response } from "express";
import asyncHandler from "express-async-handler";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { OrderStatus } from "@prisma/client";

/** GET /api/admin/analytics/overview — sales analytics for the admin dashboard */
export const getAnalyticsOverview = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const [
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueAgg,
    ordersByStatus,
    pendingCustomRequests,
    pendingRefunds,
    walletHeldAgg,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amountUsd: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.customRequest.count({ where: { status: "SUBMITTED" } }),
    prisma.refund.count({ where: { status: "PENDING" } }),
    prisma.walletHold.aggregate({ where: { status: "HELD" }, _sum: { amountUsd: true } }),
  ]);

  const last30Days = await prisma.order.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    select: { createdAt: true, totalUsd: true, status: true },
  });

  res.json({
    totalOrders,
    totalCustomers,
    totalProducts,
    totalRevenueUsd: revenueAgg._sum.amountUsd ?? 0,
    walletHeldUsd: walletHeldAgg._sum.amountUsd ?? 0,
    pendingCustomRequests,
    pendingRefunds,
    ordersByStatus: ordersByStatus.map((g) => ({ status: g.status as OrderStatus, count: g._count._all })),
    last30Days,
  });
});
