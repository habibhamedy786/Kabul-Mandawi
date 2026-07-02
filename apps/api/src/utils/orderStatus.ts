import { OrderStatus } from "@prisma/client";

/**
 * Allowed manual transitions for the admin "update order status" endpoint.
 * Automatic transitions (PENDING_PAYMENT -> PAYMENT_RECEIVED -> PROCESSING on
 * successful Stripe payment, and DELIVERED -> COMPLETED on delivery-proof
 * upload) are handled by services, not this map — they bypass manual
 * validation because they're system-driven.
 */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: [OrderStatus.CANCELLED],
  PAYMENT_RECEIVED: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.PURCHASED, OrderStatus.REFUND_PENDING, OrderStatus.CANCELLED],
  PURCHASED: [OrderStatus.OUT_FOR_DELIVERY, OrderStatus.REFUND_PENDING],
  OUT_FOR_DELIVERY: [OrderStatus.DELIVERED, OrderStatus.REFUND_PENDING],
  DELIVERED: [OrderStatus.COMPLETED, OrderStatus.REFUND_PENDING],
  COMPLETED: [],
  REFUND_PENDING: [OrderStatus.REFUNDED],
  REFUNDED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from]?.includes(to) ?? false;
}

export const ALL_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING_PAYMENT,
  OrderStatus.PAYMENT_RECEIVED,
  OrderStatus.PROCESSING,
  OrderStatus.PURCHASED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
  OrderStatus.COMPLETED,
  OrderStatus.REFUND_PENDING,
  OrderStatus.REFUNDED,
  OrderStatus.CANCELLED,
];
