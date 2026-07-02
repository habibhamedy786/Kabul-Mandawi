import { Response } from "express";
import asyncHandler from "express-async-handler";
import { z } from "zod";
import { prisma } from "@/config/prisma";
import { AuthedRequest } from "@/middleware/auth";
import { AppError } from "@/middleware/errorHandler";

/** GET /api/categories — public */
export const listCategories = asyncHandler(async (_req: AuthedRequest, res: Response) => {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  res.json(categories);
});

const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
  sortOrder: z.number().optional(),
  parentId: z.string().optional(),
});

/** POST /api/admin/categories (Admin) */
export const createCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = categorySchema.parse(req.body);
  const category = await prisma.category.create({ data });
  res.status(201).json(category);
});

/** PATCH /api/admin/categories/:id (Admin) */
export const updateCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const data = categorySchema.partial().parse(req.body);
  const category = await prisma.category.update({ where: { id: req.params.id }, data });
  res.json(category);
});

/** DELETE /api/admin/categories/:id (Admin) — soft delete */
export const deactivateCategory = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const category = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!category) throw new AppError("Category not found.", 404);
  await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.status(204).send();
});
