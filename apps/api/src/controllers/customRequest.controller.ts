import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { CustomRequestStatus, DeliveryCity, OrderStatus, PaymentStatus } from "@prisma/client";
import { createPaymentIntentForOrder } from "@/services/stripe.service";

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(5),
  city: z.nativeEnum(DeliveryCity),
  receiverName: z.string().min(2),
  receiverPhone: z.string().min(5),
  receiverAddress: z.string().min(5),
});

/**
 * POST /api/custom-requests
 * Examples: "I want a Samsung Galaxy phone delivered to my father in Kabul.",
 * "I need school supplies for my family.", "I want a refrigerator delivered."
 */
export const createCustomRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = createSchema.parse(req.body);
  const request = await prisma.customRequest.create({
    data: { ...data, userId: req.user!.sub, status: CustomRequestStatus.SUBMITTED },
  });
  res.status(201).json(request);
});

/** GET /api/custom-requests/mine */
export const listMyCustomRequests = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const requests = await prisma.customRequest.findMany({
    where: { userId: req.user!.sub },
    orderBy: { createdAt: "desc" },
    include: { convertedOrder: true },
  });
  res.json(requests);
});

/** GET /api/admin/custom-requests — staff (Admin, Customer Support) */
export const adminListCustomRequests = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { status } = req.query as Record<string, string>;
  const requests = await prisma.customRequest.findMany({
    where: status ? { status: status as CustomRequestStatus } : {},
    orderBy: { createdAt: "desc" },
    include: { user: { select: { fullName: true, email: true, phone: true } } },
  });
  res.json(requests);
});

const quoteSchema = z.object({ quotedAmountUsd: z.number().positive(), quoteNote: z.string().optional() });

/** PATCH /api/admin/custom-requests/:id/quote — admin reviews and sends a quotation */
export const quoteCustomRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { quotedAmountUsd, quoteNote } = quoteSchema.parse(req.body);
  const request = await prisma.customRequest.update({
    where: { id: req.params.id },
    data: {
      status: CustomRequestStatus.QUOTED,
      quotedAmountUsd,
      quoteNote,
      quotedById: req.user!.sub,
      quotedAt: new Date(),
    },
  });
  res.json(request);
});

function generateOrderNumber() {
  return `AFC-${Math.floor(100000 + Math.random() * 900000)}`;
}

/**
 * POST /api/admin/custom-requests/:id/convert
 * Converts an accepted quotation into a real order with a Stripe PaymentIntent,
 * exactly like a normal checkout — the customer then pays from their dashboard.
 */
export const convertCustomRequestToOrder = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const request = await prisma.customRequest.findUnique({ where: { id: req.params.id }, include: { user: true } });
  if (!request) throw new AppError("Custom request not found.", 404);
  if (!request.quotedAmountUsd) throw new AppError("This request has not been quoted yet.", 400);

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      userId: request.userId,
      receiverName: request.receiverName,
      receiverPhone: request.receiverPhone,
      city: request.city,
      deliveryAddress: request.receiverAddress,
      subtotalUsd: request.quotedAmountUsd,
      deliveryFeeUsd: 0,
      totalUsd: request.quotedAmountUsd,
      status: OrderStatus.PENDING_PAYMENT,
      items: {
        create: [{
          nameSnapshot: request.title,
          unitPriceUsd: request.quotedAmountUsd,
          quantity: 1,
          lineTotalUsd: request.quotedAmountUsd,
          isCustom: true,
        }],
      },
      statusHistory: { create: { status: OrderStatus.PENDING_PAYMENT, note: `Created from custom request ${request.id}` } },
    },
  });

  const intent = await createPaymentIntentForOrder({
    orderId: order.id,
    amountUsd: Number(request.quotedAmountUsd),
    customerEmail: request.user.email,
  });

  await prisma.payment.create({
    data: { orderId: order.id, stripePaymentIntentId: intent.id, amountUsd: request.quotedAmountUsd, status: PaymentStatus.PENDING },
  });

  await prisma.customRequest.update({
    where: { id: request.id },
    data: { status: CustomRequestStatus.CONVERTED_TO_ORDER, convertedOrderId: order.id },
  });

  res.status(201).json({ order, clientSecret: intent.client_secret });
});

const declineSchema = z.object({ note: z.string().optional() });

/** PATCH /api/admin/custom-requests/:id/decline */
export const declineCustomRequest = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { note } = declineSchema.parse(req.body);
  const request = await prisma.customRequest.update({
    where: { id: req.params.id },
    data: { status: CustomRequestStatus.DECLINED, quoteNote: note },
  });
  res.json(request);
});
