import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  createCustomRequest, listMyCustomRequests, adminListCustomRequests,
  quoteCustomRequest, convertCustomRequestToOrder, declineCustomRequest,
} from "@/controllers/customRequest.controller";

const router = Router();
router.post("/", authenticate, createCustomRequest);
router.get("/mine", authenticate, listMyCustomRequests);

export const adminCustomRequestRouter = Router();
adminCustomRequestRouter.get("/", authenticate, authorize(...ROLES.SUPPORT), adminListCustomRequests);
adminCustomRequestRouter.patch("/:id/quote", authenticate, authorize(...ROLES.ANY_ADMIN), quoteCustomRequest);
adminCustomRequestRouter.post("/:id/convert", authenticate, authorize(...ROLES.ANY_ADMIN), convertCustomRequestToOrder);
adminCustomRequestRouter.patch("/:id/decline", authenticate, authorize(...ROLES.SUPPORT), declineCustomRequest);

export default router;
