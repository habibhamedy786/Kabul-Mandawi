import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import {
  listProducts, getProduct, createProduct, updateProduct, deactivateProduct, deleteProduct, markProductRestocked,
  discountAll, clearDiscounts,
} from "@/controllers/product.controller";

const router = Router();
router.get("/", listProducts);
router.get("/:id", getProduct);

export const adminProductRouter = Router();
adminProductRouter.post("/", authenticate, authorize(...ROLES.CATALOG), createProduct);
adminProductRouter.post("/discount-all", authenticate, authorize(...ROLES.ANY_ADMIN), discountAll);
adminProductRouter.post("/discount-clear", authenticate, authorize(...ROLES.ANY_ADMIN), clearDiscounts);
adminProductRouter.patch("/:id", authenticate, authorize(...ROLES.CATALOG), updateProduct);
adminProductRouter.delete("/:id", authenticate, authorize(...ROLES.CATALOG), deactivateProduct);
adminProductRouter.delete("/:id/permanent", authenticate, authorize(...ROLES.CATALOG), deleteProduct);
adminProductRouter.patch("/:id/restock", authenticate, authorize(...ROLES.PROCUREMENT), markProductRestocked);

export default router;
