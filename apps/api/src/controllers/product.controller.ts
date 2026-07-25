import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";
import { DeliveryCity, Role } from "@prisma/client";

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
  compareAtUsd: z.number().positive().nullable().optional(),
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
  const force = req.query.force === "true";
  const orderedCount = await prisma.orderItem.count({ where: { productId: req.params.id } });

  if (orderedCount > 0) {
    // Only a Super Admin may force-delete a product that appears in past orders.
    if (!(force && req.user!.role === Role.SUPER_ADMIN)) {
      throw new AppError(
        "This product is part of past orders. Deactivate it instead, or ask a Super Admin to delete it permanently.",
        409,
      );
    }
    // Detach it from those orders first — the order lines keep their saved name
    // and price, so order history stays intact — then delete the product.
    await prisma.orderItem.updateMany({ where: { productId: req.params.id }, data: { productId: null } });
  }

  await prisma.product.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

/** POST /api/admin/products/discount-all (Admin) — put every active product on
 *  sale by `percent` off. Skips products already on sale so it never compounds. */
export const discountAll = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { percent } = z.object({ percent: z.number().min(1).max(90) }).parse(req.body);
  const factor = 1 - percent / 100;
  const updated = await prisma.$executeRaw`
    UPDATE "Product"
    SET "compareAtUsd" = "priceUsd",
        "priceUsd" = ROUND(("priceUsd" * ${factor})::numeric, 2)
    WHERE "isActive" = true AND "compareAtUsd" IS NULL`;
  res.json({ updated });
});

/** POST /api/admin/products/discount-clear (Admin) — end all sales and restore
 *  each product's original price. */
export const clearDiscounts = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const updated = await prisma.$executeRaw`
    UPDATE "Product"
    SET "priceUsd" = "compareAtUsd",
        "compareAtUsd" = NULL
    WHERE "compareAtUsd" IS NOT NULL`;
  res.json({ updated });
});

/** PATCH /api/admin/products/:id/purchased (Procurement Officer) — mark sourced/purchased */
export const markProductRestocked = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { stockQty } = z.object({ stockQty: z.number().int().min(0) }).parse(req.body);
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { stockQty } });
  res.json(product);
});
