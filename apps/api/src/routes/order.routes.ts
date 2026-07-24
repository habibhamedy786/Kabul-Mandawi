import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  createOrder, listMyOrders, getOrder,
  adminListOrders, adminUpdateOrderStatus, assignDeliveryStaff, listMyAssignments,
  adminDeliveryStats, adminListDeliveryStaff,
} from "@/controllers/order.controller";

const router = Router();
router.post("/", authenticate, createOrder);
router.get("/mine", authenticate, listMyOrders);
router.get("/:id", authenticate, getOrder);

export const adminOrderRouter = Router();
adminOrderRouter.get("/", authenticate, authorize(...ROLES.ANY_STAFF), adminListOrders);
adminOrderRouter.get("/delivery-stats", authenticate, authorize(...ROLES.DELIVERY_ASSIGN), adminDeliveryStats);
adminOrderRouter.patch("/:id/status", authenticate, authorize(...ROLES.ANY_STAFF), adminUpdateOrderStatus);
adminOrderRouter.patch("/:id/assign", authenticate, authorize(...ROLES.DELIVERY_ASSIGN), assignDeliveryStaff);

// Active delivery people, for the assign dropdown & performance view.
export const adminDeliveryStaffRouter = Router();
adminDeliveryStaffRouter.get("/", authenticate, authorize(...ROLES.DELIVERY_ASSIGN), adminListDeliveryStaff);

export const deliveryRouter = Router();
deliveryRouter.get("/my-assignments", authenticate, authorize(...ROLES.DELIVERY), listMyAssignments);

export default router;
