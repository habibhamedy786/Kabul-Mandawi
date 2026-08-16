export type Role =
  | "SUPER_ADMIN" | "ADMIN"
  | "OPERATIONS_MANAGER" | "INVENTORY_MANAGER" | "FINANCE_OFFICER" | "DELIVERY_COORDINATOR" | "MARKETING_MANAGER"
  | "PROCUREMENT_OFFICER" | "DELIVERY_STAFF" | "CUSTOMER_SUPPORT" | "CUSTOMER";

export type DeliveryCity = "KABUL" | "HERAT" | "MAZAR_I_SHARIF" | "KANDAHAR" | "JALALABAD" | "OTHER";

export type OrderStatus =
  | "PENDING_PAYMENT" | "PAYMENT_RECEIVED" | "PROCESSING" | "PURCHASED" | "OUT_FOR_DELIVERY"
  | "DELIVERED" | "COMPLETED" | "REFUND_PENDING" | "REFUNDED" | "CANCELLED";

export type WalletStatus = "NOT_APPLICABLE" | "HELD" | "RELEASED" | "REFUND_PENDING" | "REFUNDED";

export type CustomRequestStatus =
  | "SUBMITTED" | "UNDER_REVIEW" | "QUOTED" | "ACCEPTED" | "DECLINED" | "CONVERTED_TO_ORDER" | "CLOSED";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone?: string;
  country?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  nameFa?: string | null;
  namePs?: string | null;
  descriptionFa?: string | null;
  descriptionPs?: string | null;
  unitFa?: string | null;
  unitPs?: string | null;
  priceUsd: string | number;
  compareAtUsd?: string | number;
  images: string[];
  category: Category;
  unit?: string;
  isFeatured: boolean;
  stockQty: number;
}

export interface SavedAddress {
  id: string;
  label: string;
  receiverName: string;
  phone: string;
  city: DeliveryCity;
  addressLine: string;
  note?: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  unitPriceUsd: string | number;
  quantity: number;
  lineTotalUsd: string | number;
  isCustom: boolean;
}

export interface DeliveryProof {
  id: string;
  photoUrls: string[];
  signatureUrl?: string;
  receiverName: string;
  deliveryNotes?: string;
  deliveredAt: string;
  uploadedBy?: { fullName: string } | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  walletStatus: WalletStatus;
  receiverName: string;
  receiverPhone: string;
  city: DeliveryCity;
  deliveryAddress: string;
  subtotalUsd: string | number;
  deliveryFeeUsd: string | number;
  totalUsd: string | number;
  items: OrderItem[];
  deliveryProof?: DeliveryProof | null;
  assignedDeliveryStaff?: { id: string; fullName: string } | null;
  payment?: { method: string; status: string; cryptoTxHash?: string | null } | null;
  createdAt: string;
}

export interface DeliveryStaff {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}

export interface DeliveryStat {
  id: string;
  fullName: string;
  assigned: number;
  delivered: number;
}

export interface CustomRequest {
  id: string;
  title: string;
  description: string;
  city: DeliveryCity;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  status: CustomRequestStatus;
  quotedAmountUsd?: string | number;
  quoteNote?: string;
  createdAt: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
}
