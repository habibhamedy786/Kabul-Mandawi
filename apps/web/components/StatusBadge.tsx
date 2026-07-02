"use client";

import { OrderStatus, WalletStatus, CustomRequestStatus } from "@/lib/types";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

const orderStyles: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "bg-ink-100 text-ink-700",
  PAYMENT_RECEIVED: "bg-blue-50 text-blue-700",
  PROCESSING: "bg-amber-50 text-amber-700",
  PURCHASED: "bg-amber-100 text-amber-800",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-brand-100 text-brand-800",
  COMPLETED: "bg-brand-600 text-white",
  REFUND_PENDING: "bg-red-50 text-red-700",
  REFUNDED: "bg-red-100 text-red-800",
  CANCELLED: "bg-ink-200 text-ink-600",
};

const walletStyles: Record<WalletStatus, string> = {
  NOT_APPLICABLE: "bg-ink-100 text-ink-500",
  HELD: "bg-amber-50 text-amber-700",
  RELEASED: "bg-brand-100 text-brand-800",
  REFUND_PENDING: "bg-red-50 text-red-700",
  REFUNDED: "bg-red-100 text-red-800",
};

const requestStyles: Record<CustomRequestStatus, string> = {
  SUBMITTED: "bg-ink-100 text-ink-700",
  UNDER_REVIEW: "bg-blue-50 text-blue-700",
  QUOTED: "bg-amber-50 text-amber-700",
  ACCEPTED: "bg-brand-100 text-brand-800",
  DECLINED: "bg-red-100 text-red-800",
  CONVERTED_TO_ORDER: "bg-brand-600 text-white",
  CLOSED: "bg-ink-200 text-ink-600",
};

function humanize(label: string) {
  return label.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { lang } = useLang();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${orderStyles[status]}`}>
      {t[lang].status.order[status] ?? humanize(status)}
    </span>
  );
}

export function WalletStatusBadge({ status }: { status: WalletStatus }) {
  const { lang } = useLang();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${walletStyles[status]}`}>
      {t[lang].status.walletPrefix}: {t[lang].status.wallet[status] ?? humanize(status)}
    </span>
  );
}

export function CustomRequestStatusBadge({ status }: { status: CustomRequestStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${requestStyles[status]}`}>
      {humanize(status)}
    </span>
  );
}
