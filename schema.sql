-- Drop existing tables (CASCADE handles foreign keys)
DROP TABLE IF EXISTS "AuditLog" CASCADE;
DROP TABLE IF EXISTS "SupplierInvoice" CASCADE;
DROP TABLE IF EXISTS "DeliveryProof" CASCADE;
DROP TABLE IF EXISTS "Refund" CASCADE;
DROP TABLE IF EXISTS "WalletHold" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "OrderStatusHistory" CASCADE;
DROP TABLE IF EXISTS "OrderItem" CASCADE;
DROP TABLE IF EXISTS "Order" CASCADE;
DROP TABLE IF EXISTS "CustomRequest" CASCADE;
DROP TABLE IF EXISTS "Product" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "SavedAddress" CASCADE;
DROP TABLE IF EXISTS "RefreshToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Drop existing enums
DROP TYPE IF EXISTS "Role" CASCADE;
DROP TYPE IF EXISTS "OrderStatus" CASCADE;
DROP TYPE IF EXISTS "WalletStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentStatus" CASCADE;
DROP TYPE IF EXISTS "PaymentMethod" CASCADE;
DROP TYPE IF EXISTS "CustomRequestStatus" CASCADE;
DROP TYPE IF EXISTS "DeliveryCity" CASCADE;
DROP TYPE IF EXISTS "RefundStatus" CASCADE;

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'PROCUREMENT_OFFICER', 'DELIVERY_STAFF', 'CUSTOMER_SUPPORT', 'CUSTOMER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_RECEIVED', 'PROCESSING', 'PURCHASED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'REFUND_PENDING', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('NOT_APPLICABLE', 'HELD', 'RELEASED', 'REFUND_PENDING', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('VISA', 'MASTERCARD', 'APPLE_PAY', 'GOOGLE_PAY', 'CARD_OTHER');

-- CreateEnum
CREATE TYPE "CustomRequestStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'QUOTED', 'ACCEPTED', 'DECLINED', 'CONVERTED_TO_ORDER', 'CLOSED');

-- CreateEnum
CREATE TYPE "DeliveryCity" AS ENUM ('KABUL', 'HERAT', 'MAZAR_I_SHARIF', 'KANDAHAR', 'JALALABAD', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "googleId" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CUSTOMER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedAddress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" "DeliveryCity" NOT NULL,
    "addressLine" TEXT NOT NULL,
    "note" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedAddress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceUsd" DECIMAL(10,2) NOT NULL,
    "compareAtUsd" DECIMAL(10,2),
    "images" TEXT[],
    "categoryId" TEXT NOT NULL,
    "availableCities" "DeliveryCity"[],
    "stockQty" INTEGER NOT NULL DEFAULT 0,
    "unit" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" "DeliveryCity" NOT NULL,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "receiverAddress" TEXT NOT NULL,
    "status" "CustomRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "quotedAmountUsd" DECIMAL(10,2),
    "quoteNote" TEXT,
    "quotedById" TEXT,
    "quotedAt" TIMESTAMP(3),
    "convertedOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "savedAddressId" TEXT,
    "receiverName" TEXT NOT NULL,
    "receiverPhone" TEXT NOT NULL,
    "city" "DeliveryCity" NOT NULL,
    "deliveryAddress" TEXT NOT NULL,
    "deliveryNote" TEXT,
    "subtotalUsd" DECIMAL(10,2) NOT NULL,
    "deliveryFeeUsd" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalUsd" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "walletStatus" "WalletStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
    "assignedDeliveryStaffId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT,
    "nameSnapshot" TEXT NOT NULL,
    "unitPriceUsd" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "lineTotalUsd" DECIMAL(10,2) NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderStatusHistory" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "note" TEXT,
    "changedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeChargeId" TEXT,
    "method" "PaymentMethod" NOT NULL DEFAULT 'CARD_OTHER',
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletHold" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "status" "WalletStatus" NOT NULL DEFAULT 'HELD',
    "heldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "releasedAt" TIMESTAMP(3),
    "refundRequestedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "WalletHold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Refund" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
    "stripeRefundId" TEXT,
    "processedById" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliveryProof" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "photoUrls" TEXT[],
    "signatureUrl" TEXT,
    "receiverName" TEXT NOT NULL,
    "deliveryNotes" TEXT,
    "deliveredAt" TIMESTAMP(3) NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeliveryProof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "invoiceUrl" TEXT NOT NULL,
    "amountUsd" DECIMAL(10,2) NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

-- CreateIndex
CREATE INDEX "Product_isActive_isFeatured_idx" ON "Product"("isActive", "isFeatured");

-- CreateIndex
CREATE UNIQUE INDEX "CustomRequest_convertedOrderId_key" ON "CustomRequest"("convertedOrderId");

-- CreateIndex
CREATE INDEX "CustomRequest_status_idx" ON "CustomRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_stripePaymentIntentId_key" ON "Payment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletHold_orderId_key" ON "WalletHold"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Refund_orderId_key" ON "Refund"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryProof_orderId_key" ON "DeliveryProof"("orderId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedAddress" ADD CONSTRAINT "SavedAddress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomRequest" ADD CONSTRAINT "CustomRequest_convertedOrderId_fkey" FOREIGN KEY ("convertedOrderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_savedAddressId_fkey" FOREIGN KEY ("savedAddressId") REFERENCES "SavedAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_assignedDeliveryStaffId_fkey" FOREIGN KEY ("assignedDeliveryStaffId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletHold" ADD CONSTRAINT "WalletHold_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliveryProof" ADD CONSTRAINT "DeliveryProof_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierInvoice" ADD CONSTRAINT "SupplierInvoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

