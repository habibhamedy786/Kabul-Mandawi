import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  createOrder, listMyOrders, getOrder,
  adminListOrders, adminUpdateOrderStatus, assignDeliveryStaff, listMyAssignments,
} from "@/controllers/order.controller";

const router = Router();
router.post("/", authenticate, createOrder);
router.get("/mine", authenticate, listMyOrders);
router.get("/:id", authenticate, getOrder);

export const adminOrderRouter = Router();
adminOrderRouter.get("/", authenticate, authorize(...ROLES.ANY_STAFF), adminListOrders);
adminOrderRouter.patch("/:id/status", authenticate, authorize(...ROLES.ANY_STAFF), adminUpdateOrderStatus);
adminOrderRouter.patch("/:id/assign", authenticate, authorize(...ROLES.DELIVERY_ASSIGN), assignDeliveryStaff);

export const deliveryRouter = Router();
deliveryRouter.get("/my-assignments", authenticate, authorize(...ROLES.DELIVERY), listMyAssignments);

export default router;
