import { Router } from "express";

import authRoutes from "@/routes/auth.routes";
import userRoutes, { adminUserRouter, adminStaffRouter } from "@/routes/user.routes";
import categoryRoutes, { adminCategoryRouter } from "@/routes/category.routes";
import productRoutes, { adminProductRouter } from "@/routes/product.routes";
import orderRoutes, { adminOrderRouter, deliveryRouter } from "@/routes/order.routes";
import customRequestRoutes, { adminCustomRequestRouter } from "@/routes/customRequest.routes";
import walletRoutes from "@/routes/wallet.routes";
import { adminRefundRouter, orderRefundRouter } from "@/routes/refund.routes";
import { orderProofRouter, adminProofRouter } from "@/routes/deliveryProof.routes";
import paymentRoutes from "@/routes/payment.routes";
import adminAnalyticsRoutes from "@/routes/admin.routes";
import contactRoutes, { adminContactRouter } from "@/routes/contact.routes";

const router = Router();

// ── Public / customer-facing ────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/categories", categoryRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/orders", orderProofRouter);     // GET /orders/:id/delivery-proof
router.use("/custom-requests", customRequestRoutes);
router.use("/wallet", walletRoutes);
router.use("/payments", paymentRoutes);
router.use("/contact", contactRoutes);
router.use("/delivery", deliveryRouter);     // Delivery Staff: GET /delivery/my-assignments

// ── Admin / staff (each sub-router applies its own RBAC) ────────
router.use("/admin/users", adminUserRouter);
router.use("/admin/staff", adminStaffRouter);
router.use("/admin/categories", adminCategoryRouter);
router.use("/admin/products", adminProductRouter);
router.use("/admin/orders", adminOrderRouter);
router.use("/admin/orders", adminProofRouter);     // POST delivery-proof, supplier-invoice
router.use("/admin/orders", orderRefundRouter);    // refund-request, refund-process
router.use("/admin/custom-requests", adminCustomRequestRouter);
router.use("/admin/refunds", adminRefundRouter);
router.use("/admin/contact", adminContactRouter);
router.use("/admin", adminAnalyticsRoutes);

export default router;
