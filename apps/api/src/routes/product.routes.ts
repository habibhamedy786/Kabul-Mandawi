import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  listProducts, getProduct, createProduct, updateProduct, deactivateProduct, deleteProduct, markProductRestocked,
} from "@/controllers/product.controller";

const router = Router();
router.get("/", listProducts);
router.get("/:id", getProduct);

export const adminProductRouter = Router();
adminProductRouter.post("/", authenticate, authorize(...ROLES.CATALOG), createProduct);
adminProductRouter.patch("/:id", authenticate, authorize(...ROLES.CATALOG), updateProduct);
adminProductRouter.delete("/:id", authenticate, authorize(...ROLES.CATALOG), deactivateProduct);
adminProductRouter.delete("/:id/permanent", authenticate, authorize(...ROLES.CATALOG), deleteProduct);
adminProductRouter.patch("/:id/restock", authenticate, authorize(...ROLES.PROCUREMENT), markProductRestocked);

export default router;
