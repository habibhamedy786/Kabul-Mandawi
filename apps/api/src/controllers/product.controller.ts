import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { DeliveryCity } from "@prisma/client";

const listQuerySchema = z.object({
  category: z.string().optional(),     // category slug
  city: z.nativeEnum(DeliveryCity).optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(24),
});

/** GET /api/products — public, supports filtering/pagination for 1000+ catalog items */
export const listProducts = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const q = listQuerySchema.parse(req.query);
  const take = q.pageSize;
  const skip = (q.page - 1) * take;

  const where = {
    isActive: true,
    ...(q.category ? { category: { slug: q.category } } : {}),
    ...(q.city ? { availableCities: { has: q.city } } : {}),
    ...(q.featured !== undefined ? { isFeatured: q.featured } : {}),
    ...(q.search ? {
      OR: [
        { name: { contains: q.search, mode: "insensitive" as const } },
        { description: { contains: q.search, mode: "insensitive" as const } },
        { tags: { has: q.search } },
      ],
    } : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({ where, take, skip, orderBy: { createdAt: "desc" }, include: { category: true } }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: q.page, pageSize: take, totalPages: Math.ceil(total / take) });
});

/** GET /api/products/:id — public */
export const getProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!product || !product.isActive) throw new AppError("Product not found.", 404);
  res.json(product);
});

const productSchema = z.object({
  sku: z.string().min(2),
  name: z.string().min(2),
  description: z.string().min(2),
  // Optional Dari / Pashto translations (empty strings are normalised to null).
  nameFa: z.string().optional().nullable(),
  namePs: z.string().optional().nullable(),
  descriptionFa: z.string().optional().nullable(),
  descriptionPs: z.string().optional().nullable(),
  unitFa: z.string().optional().nullable(),
  unitPs: z.string().optional().nullable(),
  priceUsd: z.number().positive(),
  compareAtUsd: z.number().positive().optional(),
  images: z.array(z.string().url()).default([]),
  categoryId: z.string(),
  availableCities: z.array(z.nativeEnum(DeliveryCity)).default([DeliveryCity.KABUL]),
  stockQty: z.number().int().min(0).default(0),
  unit: z.string().optional(),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).default([]),
});

/** POST /api/admin/products (Admin) */
export const createProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = productSchema.parse(req.body);
  const product = await prisma.product.create({ data });
  res.status(201).json(product);
});

/** PATCH /api/admin/products/:id (Admin) */
export const updateProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = productSchema.partial().parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data });
  res.json(product);
});

/** DELETE /api/admin/products/:id (Admin) — soft delete to preserve order history */
export const deactivateProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});

/** DELETE /api/admin/products/:id/permanent (Admin) — hard delete, only when the
 *  product has never been part of an order (otherwise order history would break;
 *  the admin should deactivate it instead). */
export const deleteProduct = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const orderedCount = await prisma.orderItem.count({ where: { productId: req.params.id } });
  if (orderedCount > 0) {
    throw new AppError(
      "This product is part of past orders, so it can't be permanently deleted. Deactivate it instead to hide it from the store.",
      409,
    );
  }
  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

/** PATCH /api/admin/products/:id/purchased (Procurement Officer) — mark sourced/purchased */
export const markProductRestocked = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { stockQty } = z.object({ stockQty: z.number().int().min(0) }).parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { stockQty } });
  res.json(product);
});
