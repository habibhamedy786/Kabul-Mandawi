"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface RefundRow {
  id: string;
  status: "PENDING" | "PROCESSED" | "FAILED";
  reason: string;
  amountUsd?: string | number;
  order: { id: string; orderNumber: string; totalUsd: string | number; user: { fullName: string; email: string } };
}

export default function AdminRefundsPage() {
  const { user } = useAuth();
  const canProcess = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function load() {
    api.admin.refunds.list().then((r) => setRefunds(r as RefundRow[])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function process(orderId: string) {
    setBusyId(orderId); setError("");
    try {
      await api.admin.refunds.process(orderId);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not process refund.");
    } finally { setBusyId(null); }
  }

  if (loading) return <div className="text-ink-400">Loading refunds…</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">Refunds</h2>
      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {refunds.length === 0 && <p className="text-ink-400">No refunds on record.</p>}
      <div className="space-y-3">
        {refunds.map((r) => (
          <Card key={r.id}>
            <CardBody className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{r.order.orderNumber}</p>
                <p className="text-xs text-ink-400">{r.order.user.fullName} · {r.order.user.email}</p>
                <p className="text-sm text-ink-600">{r.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700">{r.status}</span>
                <span className="font-semibold text-ink-900">${Number(r.order.totalUsd).toFixed(2)}</span>
                {r.status === "PENDING" && canProcess && (
                  <Button size="sm" disabled={busyId === r.id} onClick={() => process(r.order.id)}>Process refund</Button>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
