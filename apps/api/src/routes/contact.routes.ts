import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import { createContactMessage, adminListContactMessages, adminMarkContactRead } from "@/controllers/contact.controller";

// Public contact form — throttled so bots can't flood the inbox.
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

const router = Router();
router.post("/", contactLimiter, createContactMessage);

export const adminContactRouter = Router();
adminContactRouter.get("/", authenticate, authorize(...ROLES.SUPPORT), adminListContactMessages);
adminContactRouter.patch("/:id/read", authenticate, authorize(...ROLES.SUPPORT), adminMarkContactRead);

export default router;
