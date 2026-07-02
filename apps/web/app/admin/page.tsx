"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { OrderStatus } from "@/lib/types";

interface Analytics {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenueUsd: number;
  walletHeldUsd: number;
  pendingCustomRequests: number;
  pendingRefunds: number;
  ordersByStatus: { status: OrderStatus; count: number }[];
  last30Days: { createdAt: string; totalUsd: string | number; status: OrderStatus }[];
}

function humanize(s: string) {
  return s.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminOverviewPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.analytics().then((d) => setData(d as Analytics)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">Loading analytics…</div>;
  if (!data) return <div className="text-ink-400">No analytics available.</div>;

  const stats = [
    { label: "Total orders", value: data.totalOrders },
    { label: "Customers", value: data.totalCustomers },
    { label: "Active products", value: data.totalProducts },
    { label: "Revenue collected", value: `$${Number(data.totalRevenueUsd).toFixed(2)}` },
    { label: "Wallet funds held", value: `$${Number(data.walletHeldUsd).toFixed(2)}` },
    { label: "Pending custom requests", value: data.pendingCustomRequests },
    { label: "Pending refunds", value: data.pendingRefunds },
    { label: "Orders (last 30 days)", value: data.last30Days.length },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardBody>
              <p className="text-sm text-ink-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-ink-900">{s.value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><h2 className="font-semibold text-ink-900">Orders by status</h2></CardHeader>
        <CardBody className="space-y-2">
          {data.ordersByStatus.map((g) => (
            <div key={g.status} className="flex items-center justify-between text-sm">
              <span className="text-ink-700">{humanize(g.status)}</span>
              <span className="font-semibold text-ink-900">{g.count}</span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
