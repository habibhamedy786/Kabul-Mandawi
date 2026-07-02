import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import { adminListRefunds, adminRequestRefund, adminProcessRefund } from "@/controllers/refund.controller";

export const adminRefundRouter = Router(); // mounted at /api/admin/refunds
adminRefundRouter.get("/", authenticate, authorize(...ROLES.SUPPORT), adminListRefunds);

export const orderRefundRouter = Router(); // mounted at /api/admin/orders
orderRefundRouter.post("/:id/refund-request", authenticate, authorize(...ROLES.SUPPORT), adminRequestRefund);
orderRefundRouter.post("/:id/refund-process", authenticate, authorize(...ROLES.ANY_ADMIN), adminProcessRefund);
