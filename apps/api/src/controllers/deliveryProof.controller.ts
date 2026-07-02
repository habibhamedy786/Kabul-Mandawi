import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { uploadBuffer } from "@/services/storage.service";
import * as walletService from "@/services/wallet.service";
import { OrderStatus } from "@prisma/client";

const metaSchema = z.object({
  receiverName: z.string().min(2),
  deliveryNotes: z.string().optional(),
  deliveredAt: z.string().datetime().optional(),
});

/**
 * POST /api/admin/orders/:id/delivery-proof (multipart/form-data)
 * Fields: photos[] (files, up to 5), signature (file, optional), plus the
 * metaSchema JSON fields. Delivery Staff or Admin only.
 *
 * Uploading proof is what flips Wallet Status Held -> Released and
 * Order Status -> Completed (steps 7-9 of the spec).
 */
export const uploadDeliveryProof = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("Order not found.", 404);
  if (!([OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PURCHASED] as OrderStatus[]).includes(order.status)) {
    throw new AppError(`Cannot upload delivery proof while order is in status ${order.status}.`, 400);
  }

  const data = metaSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[]) ?? [];
  const photoFiles = files.filter((f) => f.fieldname === "photos");
  const signatureFile = files.find((f) => f.fieldname === "signature");

  if (photoFiles.length === 0) throw new AppError("At least one delivery photo is required.", 400);

  const photoUrls = await Promise.all(
    photoFiles.map((f) => uploadBuffer({ buffer: f.buffer, mimeType: f.mimetype, folder: `delivery-proofs/${order.id}` }))
  );
  const signatureUrl = signatureFile
    ? await uploadBuffer({ buffer: signatureFile.buffer, mimeType: signatureFile.mimetype, folder: `delivery-proofs/${order.id}` })
    : undefined;

  const proof = await prisma.deliveryProof.upsert({
    where: { orderId: order.id },
    update: {
      photoUrls, signatureUrl, receiverName: data.receiverName, deliveryNotes: data.deliveryNotes,
      deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : new Date(),
    },
    create: {
      orderId: order.id,
      photoUrls,
      signatureUrl,
      receiverName: data.receiverName,
      deliveryNotes: data.deliveryNotes,
      deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : new Date(),
      uploadedById: req.user!.sub,
    },
  });

  await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.DELIVERED } });
  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: OrderStatus.DELIVERED, note: "Delivery proof uploaded.", changedById: req.user!.sub },
  });

  await walletService.releaseFunds(order.id);

  res.status(201).json(proof);
});

/** GET /api/orders/:id/delivery-proof — owner or staff */
export const getDeliveryProof = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const proof = await prisma.deliveryProof.findUnique({ where: { orderId: req.params.id }, include: { order: true } });
  if (!proof) throw new AppError("Delivery proof not found.", 404);

  const isOwner = proof.order.userId === req.user!.sub;
  const isStaff = req.user!.role !== "CUSTOMER";
  if (!isOwner && !isStaff) throw new AppError("Not authorized.", 403);

  res.json(proof);
});

const invoiceSchema = z.object({ supplierName: z.string().min(2), invoiceUrl: z.string().url(), amountUsd: z.number().positive() });

/** POST /api/admin/orders/:id/supplier-invoice — Procurement Officer marks purchased + uploads invoice */
export const uploadSupplierInvoice = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = invoiceSchema.parse(req.body);
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) throw new AppError("Order not found.", 404);

  const invoice = await prisma.supplierInvoice.create({
    data: { ...data, orderId: order.id, uploadedById: req.user!.sub },
  });

  if (order.status === OrderStatus.PROCESSING) {
    await prisma.order.update({ where: { id: order.id }, data: { status: OrderStatus.PURCHASED } });
    await prisma.orderStatusHistory.create({
      data: { orderId: order.id, status: OrderStatus.PURCHASED, note: `Purchased; invoice from ${data.supplierName}.`, changedById: req.user!.sub },
    });
  }

  res.status(201).json(invoice);
});
