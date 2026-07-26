import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Stripe from "stripe";
import { prisma } from "@/config/prisma";
import { env } from "@/config/env";
import { stripe } from "@/services/stripe.service";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import * as walletService from "@/services/wallet.service";
import { sendEmail, orderConfirmationEmail } from "@/services/email.service";
import { getAfnRate } from "@/services/currency.service";

function mapPaymentMethod(intent: Stripe.PaymentIntent): PaymentMethod {
  const type = intent.payment_method_types?.[0];
  if (type === "card") {
    const brand = (intent as unknown as { charges?: { data?: Array<{ payment_method_details?: { card?: { brand?: string; wallet?: { type?: string } } } }> } })
      .charges?.data?.[0]?.payment_method_details?.card;
    if (brand?.wallet?.type === "apple_pay") return PaymentMethod.APPLE_PAY;
    if (brand?.wallet?.type === "google_pay") return PaymentMethod.GOOGLE_PAY;
    if (brand?.brand === "visa") return PaymentMethod.VISA;
    if (brand?.brand === "mastercard") return PaymentMethod.MASTERCARD;
  }
  return PaymentMethod.CARD_OTHER;
}

/**
 * POST /api/payments/webhook (raw body — registered before express.json() in app.ts)
 * Drives the Wallet Hold system: on payment_intent.succeeded we mark the
 * order Payment Received, place the Wallet Hold, and move the order to
 * Processing — steps 3-5 of the spec's wallet hold flow.
 */
export const stripeWebhookHandler = asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"] as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
  } catch (err) {
    res.status(400).send(`Webhook signature verification failed: ${(err as Error).message}`);
    return;
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (!orderId) break;

      const payment = await prisma.payment.findUnique({ where: { orderId } });
      if (!payment || payment.status === PaymentStatus.PAID) break; // idempotency guard

      await prisma.payment.update({
        where: { orderId },
        data: {
          status: PaymentStatus.PAID,
          stripeChargeId: typeof intent.latest_charge === "string" ? intent.latest_charge : undefined,
          method: mapPaymentMethod(intent),
          paidAt: new Date(),
        },
      });

      await walletService.holdFunds(orderId);

      // Order confirmation email (skipped + logged until RESEND_API_KEY is
      // set; a failed email must never fail the webhook).
      try {
        const order = await prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true, user: { select: { email: true } } },
        });
        if (order) {
          const mail = orderConfirmationEmail({
            orderNumber: order.orderNumber,
            totalUsd: Number(order.totalUsd),
            receiverName: order.receiverName,
            city: order.city,
            items: order.items.map((i) => ({
              name: i.nameSnapshot,
              quantity: i.quantity,
              lineTotalUsd: Number(i.lineTotalUsd),
            })),
            afnPerUsd: await getAfnRate(),
          });
          await sendEmail({ to: order.user.email, ...mail });
        }
      } catch (err) {
        console.error("Order confirmation email failed:", err);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;
      if (orderId) {
        await prisma.payment.updateMany({ where: { orderId }, data: { status: PaymentStatus.FAILED } });
      }
      break;
    }

    default:
      break; // unhandled event types are ignored
  }

  res.json({ received: true });
});

/** GET /api/payments/config — exposes the publishable key to the frontend */
export const getStripeConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ publishableKey: env.stripe.publishableKey });
});
