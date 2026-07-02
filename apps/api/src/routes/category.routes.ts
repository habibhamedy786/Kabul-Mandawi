import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import { listCategories, createCategory, updateCategory, deactivateCategory } from "@/controllers/category.controller";

const router = Router();
router.get("/", listCategories);

export const adminCategoryRouter = Router();
adminCategoryRouter.post("/", authenticate, authorize(...ROLES.ANY_ADMIN), createCategory);
adminCategoryRouter.patch("/:id", authenticate, authorize(...ROLES.ANY_ADMIN), updateCategory);
adminCategoryRouter.delete("/:id", authenticate, authorize(...ROLES.ANY_ADMIN), deactivateCategory);

export default router;
