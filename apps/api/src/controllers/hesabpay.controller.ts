import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import * as walletService from "@/services/wallet.service";
import * as hesabpay from "@/services/hesabpay.service";

/**
 * POST /api/payments/hesabpay/create — starts a HesabPay payment for an order
 * and returns the URL to redirect the customer to. The frontend calls this
 * instead of the Stripe flow when PAYMENT_PROVIDER=hesabpay.
 */
export const createHesabPayPayment = asyncHandler(async (req: AuthedRequest, res: Response) => {
  if (!hesabpay.isHesabPayConfigured()) {
    throw new AppError("HesabPay is not configured on this server yet.", 503);
  }

  const { orderId } = req.body as { orderId?: string };
  if (!orderId) throw new AppError("orderId is required.", 400);

  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } });
  if (!order) throw new AppError("Order not found.", 404);
  if (order.userId !== req.user!.sub) throw new AppError("You can only pay for your own orders.", 403);

  const result = await hesabpay.createPaymentForOrder({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountUsd: Number(order.totalUsd),
    customerEmail: order.user.email,
  });

  // TODO: persist result.providerRef on the Payment row (add a providerRef column)
  //       so refundPayment() can reference it later.
  res.json({ paymentUrl: result.paymentUrl, providerRef: result.providerRef });
});

/**
 * POST /api/payments/hesabpay/webhook — HesabPay calls this when a payment
 * settles. Registered with a raw body in app.ts for signature verification.
 * On success it marks the order paid and places the Wallet Hold — the exact
 * same outcome as the Stripe webhook.
 */
export const hesabPayWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  // TODO: confirm HesabPay's signature header name from their docs.
  const signature = req.headers["x-hesab-signature"] as string | undefined;
  if (!hesabpay.verifyWebhookSignature(req.body as Buffer, signature)) {
    res.status(400).send("Invalid HesabPay webhook signature.");
    return;
  }

  const body = JSON.parse((req.body as Buffer).toString("utf8")) as Record<string, unknown>;
  const event = hesabpay.parseWebhookEvent(body);
  if (!event.orderId) {
    res.json({ received: true });
    return;
  }

  if (event.type === "succeeded") {
    const payment = await prisma.payment.findUnique({ where: { orderId: event.orderId } });
    if (payment && payment.status !== PaymentStatus.PAID) {
      await prisma.payment.update({
        where: { orderId: event.orderId },
        data: { status: PaymentStatus.PAID, method: PaymentMethod.CARD_OTHER, paidAt: new Date() },
      });
      await walletService.holdFunds(event.orderId);
    }
  } else if (event.type === "failed") {
    await prisma.payment.updateMany({ where: { orderId: event.orderId }, data: { status: PaymentStatus.FAILED } });
  }

  res.json({ received: true });
});
