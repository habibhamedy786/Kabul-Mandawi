import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { getStripeConfig } from "@/controllers/payment.controller";
import { createHesabPayPayment } from "@/controllers/hesabpay.controller";

// Note: the actual /webhook routes are registered directly in app.ts because they
// require the raw request body for signature verification (Stripe + HesabPay).
const router = Router();
router.get("/config", getStripeConfig);

// HesabPay: start a payment for an order (returns a redirect URL).
router.post("/hesabpay/create", authenticate, createHesabPayPayment);

export default router;
