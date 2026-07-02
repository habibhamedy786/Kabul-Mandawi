"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { OrderStatusBadge, WalletStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

const ACTIVE_STATUSES = ["PENDING_PAYMENT", "PAYMENT_RECEIVED", "PROCESSING", "PURCHASED", "OUT_FOR_DELIVERY"];
const COMPLETED_STATUSES = ["DELIVERED", "COMPLETED"];

export default function DashboardOverviewPage() {
  const { lang } = useLang();
  const tx = t[lang].dashboard;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.mine().then((o) => setOrders(o as Order[])).finally(() => setLoading(false));
  }, []);

  const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const completed = orders.filter((o) => COMPLETED_STATUSES.includes(o.status));
  const held = orders.filter((o) => o.walletStatus === "HELD");

  if (loading) return <div className="text-ink-400">{tx.loading}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><CardBody><p className="text-sm text-ink-500">{tx.activeOrders}</p><p className="mt-1 text-3xl font-bold text-ink-900">{active.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-500">{tx.completedOrders}</p><p className="mt-1 text-3xl font-bold text-ink-900">{completed.length}</p></CardBody></Card>
        <Card><CardBody><p className="text-sm text-ink-500">{tx.fundsHeld}</p><p className="mt-1 text-3xl font-bold text-ink-900">{held.length}</p></CardBody></Card>
      </div>

      <Card>
        <CardBody>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">{tx.recentOrders}</h2>
            <Link href="/dashboard/orders" className="text-sm font-medium text-brand-700">{tx.viewAll}</Link>
          </div>
          <div className="mt-4 space-y-3">
            {orders.slice(0, 5).map((o) => (
              <div key={o.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
                <div>
                  <p className="font-medium text-ink-900">{o.orderNumber}</p>
                  <p className="text-ink-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <WalletStatusBadge status={o.walletStatus} />
                </div>
                <p className="font-semibold text-ink-900">${Number(o.totalUsd).toFixed(2)}</p>
              </div>
            ))}
            {orders.length === 0 && <p className="text-ink-400">{tx.noOrders} <Link href="/products" className="text-brand-700 underline">{tx.startShopping}</Link>.</p>}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
