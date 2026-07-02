import { prisma } from "@/config/prisma";
import { OrderStatus, WalletStatus, RefundStatus } from "@prisma/client";
import { stripe } from "@/services/stripe.service";
import { AppError } from "@/middleware/errorHandler";

/**
 * Wallet Hold System
 * ------------------
 * 1. Customer pays -> funds are captured immediately by Stripe (charged to card,
 *    settle to the company's bank account on Stripe's normal payout schedule).
 * 2. Internally we mark the funds as "Held" against the order until the family
 *    in Afghanistan actually receives the goods (delivery proof uploaded).
 * 3. On delivery proof upload: Held -> Released, Order -> Completed.
 * 4. If delivery cannot be completed: Held -> Refund Pending -> Refunded
 *    (a real Stripe refund is issued back to the customer's card).
 */

/** Called after Stripe confirms payment succeeded. */
export async function holdFunds(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  await prisma.walletHold.upsert({
    where: { orderId },
    update: { status: WalletStatus.HELD, heldAt: new Date() },
    create: { orderId, amountUsd: order.totalUsd, status: WalletStatus.HELD },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.PROCESSING, walletStatus: WalletStatus.HELD },
  });

  await prisma.orderStatusHistory.createMany({
    data: [
      { orderId, status: OrderStatus.PAYMENT_RECEIVED, note: "Stripe payment captured." },
      { orderId, status: OrderStatus.PROCESSING, note: "Wallet hold placed; order moved to processing." },
    ],
  });
}

/** Called when delivery proof is uploaded and confirmed. */
export async function releaseFunds(orderId: string) {
  const hold = await prisma.walletHold.findUnique({ where: { orderId } });
  if (!hold) throw new AppError("No wallet hold found for this order.", 404);

  await prisma.walletHold.update({
    where: { orderId },
    data: { status: WalletStatus.RELEASED, releasedAt: new Date() },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.COMPLETED, walletStatus: WalletStatus.RELEASED },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: OrderStatus.COMPLETED, note: "Delivery proof confirmed; wallet funds released." },
  });
}

/** Admin/support marks delivery as not completable -> starts refund flow. */
export async function requestRefund(orderId: string, reason: string, actorId?: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  await prisma.refund.upsert({
    where: { orderId },
    update: { reason, status: RefundStatus.PENDING },
    create: { orderId, amountUsd: order.totalUsd, reason, status: RefundStatus.PENDING },
  });

  await prisma.walletHold.update({
    where: { orderId },
    data: { status: WalletStatus.REFUND_PENDING, refundRequestedAt: new Date() },
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.REFUND_PENDING, walletStatus: WalletStatus.REFUND_PENDING },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: OrderStatus.REFUND_PENDING, note: reason, changedById: actorId },
  });
}

/** Admin processes the refund — issues a real Stripe refund to the customer's card. */
export async function processRefund(orderId: string, actorId?: string) {
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment?.stripePaymentIntentId) {
    throw new AppError("No captured payment found to refund.", 400);
  }

  const stripeRefund = await stripe.refunds.create({
    payment_intent: payment.stripePaymentIntentId,
  });

  await prisma.refund.update({
    where: { orderId },
    data: { status: RefundStatus.PROCESSED, stripeRefundId: stripeRefund.id, processedById: actorId, processedAt: new Date() },
  });

  await prisma.walletHold.update({
    where: { orderId },
    data: { status: WalletStatus.REFUNDED, refundedAt: new Date() },
  });

  await prisma.payment.update({ where: { orderId }, data: { status: "REFUNDED" } });

  await prisma.order.update({
    where: { id: orderId },
    data: { status: OrderStatus.REFUNDED, walletStatus: WalletStatus.REFUNDED },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: OrderStatus.REFUNDED, note: "Refund processed via Stripe.", changedById: actorId },
  });
}
