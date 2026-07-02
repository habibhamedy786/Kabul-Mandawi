import { Router } from "express";
import { authenticate } from "@/middleware/auth";
import { authorize, ROLES } from "@/middleware/rbac";
import { upload } from "@/middleware/upload";
import { uploadDeliveryProof, getDeliveryProof, uploadSupplierInvoice } from "@/controllers/deliveryProof.controller";

export const orderProofRouter = Router(); // mounted at /api/orders
orderProofRouter.get("/:id/delivery-proof", authenticate, getDeliveryProof);

export const adminProofRouter = Router(); // mounted at /api/admin/orders
adminProofRouter.post(
  "/:id/delivery-proof",
  authenticate,
  authorize(...ROLES.DELIVERY),
  upload.fields([{ name: "photos", maxCount: 5 }, { name: "signature", maxCount: 1 }]),
  uploadDeliveryProof,
);
adminProofRouter.post("/:id/supplier-invoice", authenticate, authorize(...ROLES.PROCUREMENT), uploadSupplierInvoice);
