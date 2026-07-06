import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { DeliveryCity, OrderStatus, PaymentStatus, PaymentMethod } from "@prisma/client";
import { createPaymentIntentForOrder } from "@/services/stripe.service";
import { canTransition } from "@/utils/orderStatus";
import * as walletService from "@/services/wallet.service";
import { sendEmail, orderConfirmationEmail } from "@/services/email.service";

const EXPRESS_FEE_USD = 5; // same-day express delivery; standard delivery in Kabul is free

const checkoutItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
});

const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1),
  savedAddressId: z.string().optional(),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(5),
  city: z.nativeEnum(DeliveryCity),
  deliveryAddress: z.string().min(5),
  deliveryNote: z.string().optional(),
  // ONLINE = card via the payment gateway; COD = receiver pays cash on delivery.
  paymentMethod: z.enum(["ONLINE", "COD"]).default("ONLINE"),
  // STANDARD = free next-day; EXPRESS = same-day for a $5 fee.
  deliveryType: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),
});

function generateOrderNumber() {
  return `KM-${Math.floor(100000 + Math.random() * 900000)}`;
}

/** POST /api/orders — creates an order + Stripe PaymentIntent for checkout. */
export const createOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = checkoutSchema.parse(req.body);

  const productIds = data.items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, isActive: true } });
  if (products.length !== productIds.length) {
    throw new AppError("One or more products are unavailable.", 400);
  }

  let subtotal = 0;
  const itemsData = data.items.map((item) => {
    const product = products.find((p) => p.id === item.productId)!;
    const lineTotal = Number(product.priceUsd) * item.quantity;
    subtotal += lineTotal;
    return {
      productId: product.id,
      nameSnapshot: product.name,
      unitPriceUsd: product.priceUsd,
      quantity: item.quantity,
      lineTotalUsd: lineTotal,
    };
  });

  const isExpress = data.deliveryType === "EXPRESS";
  const deliveryFee = isExpress ? EXPRESS_FEE_USD : 0; // standard delivery in Kabul is free
  const total = subtotal + deliveryFee;
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.sub } });
  const isCod = data.paymentMethod === "COD";

  // COD orders skip the payment gateway entirely: they start in PROCESSING
  // (staff can act immediately) and the receiver pays cash at the door.
  const initialStatus = isCod ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT;
  const initialNote = isCod
    ? "Cash-on-delivery order placed. Receiver pays on delivery."
    : "Order created, awaiting payment.";

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: user.id,
      savedAddressId: data.savedAddressId,
      receiverName: data.receiverName,
      receiverPhone: data.receiverPhone,
      city: data.city,
      deliveryAddress: data.deliveryAddress,
      deliveryNote: data.deliveryNote,
      isExpress,
      subtotalUsd: subtotal,
      deliveryFeeUsd: deliveryFee,
      totalUsd: total,
      status: initialStatus,
      items: { create: itemsData },
      statusHistory: { create: { status: initialStatus, note: initialNote } },
    },
    include: { items: true },
  });

  if (isCod) {
    await prisma.payment.create({
      data: {
        orderId: order.id,
        method: PaymentMethod.CASH_ON_DELIVERY,
        amountUsd: total,
        status: PaymentStatus.PENDING, // marked PAID by staff once cash is collected
      },
    });

    // Confirmation email (skipped + logged until RESEND_API_KEY is set).
    try {
      const mail = orderConfirmationEmail({
        orderNumber: order.orderNumber,
        totalUsd: total,
        receiverName: order.receiverName,
        city: order.city,
        items: order.items.map((i) => ({
          name: i.nameSnapshot,
          quantity: i.quantity,
          lineTotalUsd: Number(i.lineTotalUsd),
        })),
        cod: true,
      });
      await sendEmail({ to: user.email, ...mail });
    } catch (err) {
      console.error("COD confirmation email failed:", err);
    }

    res.status(201).json({ order, cod: true });
    return;
  }

  let intent;
  try {
    intent = await createPaymentIntentForOrder({
      orderId: order.id,
      amountUsd: total,
      customerEmail: user.email,
    });
  } catch (err) {
    // Payment gateway rejected (e.g. keys not configured yet) — remove the
    // just-created order so it doesn't linger as a stuck PENDING_PAYMENT row.
    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    console.error("Payment intent creation failed:", err);
    throw new AppError(
      "Online payment is not available yet. Please try again later or contact support.",
      503
    );
  }

  await prisma.payment.create({
    data: {
      orderId: order.id,
      stripePaymentIntentId: intent.id,
      amountUsd: total,
      status: PaymentStatus.PENDING,
    },
  });

  res.status(201).json({ order, clientSecret: intent.client_secret });
});

/** GET /api/orders/mine */
export const listMyOrders = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    include: { items: true, payment: true, walletHold: true, deliveryProof: true, refund: true },
  });
  res.json(orders);
});

/** GET /api/orders/:id — owner or staff */
export const getOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: true, payment: true, walletHold: true, deliveryProof: true,
      refund: true, statusHistory: { orderBy: { createdAt: "asc" } }, user: true,
    },
  });
  if (!order) throw new AppError("Order not found.", 404);

  const isOwner = order.userId === req.user!.sub;
  const isStaff = req.user!.role !== "CUSTOMER";
  if (!isOwner && !isStaff) throw new AppError("Not authorized to view this order.", 403);

  res.json(order);
});

/** GET /api/admin/orders — staff list with filters */
export const adminListOrders = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, city, page = "1", pageSize = "25" } = req.query as Record<string, string>;
  const take = Number(pageSize);
  const skip = (Number(page) - 1) * take;

  const where = {
    ...(status ? { status: status as OrderStatus } : {}),
    ...(city ? { city: city as DeliveryCity } : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where, take, skip, orderBy: { createdAt: "desc" },
      include: { items: true, payment: true, walletHold: true, user: { select: { fullName: true, email: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page: Number(page), pageSize: take });
});

const statusUpdateSchema = z.object({ status: z.nativeEnum(OrderStatus), note: z.string().optional() });

/** PATCH /api/admin/orders/:id/status — validated manual transition */
export const adminUpdateOrderStatus = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status, note } = statusUpdateSchema.parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("Order not found.", 404);

  if (!canTransition(order.status, status)) {
    throw new AppError(`Cannot move order from ${order.status} to ${status}.`, 400);
  }

  if (status === OrderStatus.REFUND_PENDING) {
    await walletService.requestRefund(order.id, note ?? "Delivery could not be completed.", req.user!.sub);
  } else {
    await prisma.order.update({ where: { id: order.id }, data: { status } });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status, note, changedById: req.user!.sub },
    });
  }

  const updated = await prisma.order.findUnique({ where: { id: order.id } });
  res.json(updated);
});

const assignSchema = z.object({ deliveryStaffId: z.string() });

/** PATCH /api/admin/orders/:id/assign — assign delivery staff */
export const assignDeliveryStaff = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { deliveryStaffId } = assignSchema.parse(req.body);
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { assignedDeliveryStaffId: deliveryStaffId },
  });
  res.json(order);
});

/** GET /api/delivery/my-assignments — Delivery Staff view */
export const listMyAssignments = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const orders = await prisma.order.findMany({
    where: { assignedDeliveryStaffId: req.user!.sub, status: { in: [OrderStatus.PURCHASED, OrderStatus.OUT_FOR_DELIVERY] } },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(orders);
});
