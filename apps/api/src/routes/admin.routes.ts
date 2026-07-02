import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import { getAnalyticsOverview } from "@/controllers/admin.controller";

const router = Router();
router.get("/analytics/overview", authenticate, authorize(...ROLES.ANY_ADMIN), getAnalyticsOverview);

export default router;
