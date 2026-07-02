"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Order, OrderStatus } from "@/lib/types";
import { OrderStatusBadge, WalletStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";

// Mirrors apps/api/src/utils/orderStatus.ts — keeps the dropdown to valid
// manual transitions; the API re-validates server-side regardless.
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  PAYMENT_RECEIVED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PURCHASED", "REFUND_PENDING", "CANCELLED"],
  PURCHASED: ["OUT_FOR_DELIVERY", "REFUND_PENDING"],
  OUT_FOR_DELIVERY: ["DELIVERED", "REFUND_PENDING"],
  DELIVERED: ["COMPLETED", "REFUND_PENDING"],
  COMPLETED: [],
  REFUND_PENDING: ["REFUNDED"],
  REFUNDED: [],
  CANCELLED: [],
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    api.admin.orders.list(q)
      .then((d) => setOrders((d as { orders: Order[] }).orders))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  async function updateStatus(id: string, status: OrderStatus) {
    setBusyId(id); setError("");
    try {
      await api.admin.orders.updateStatus(id, { status });
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-ink-900">Orders</h2>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-56">
          <option value="">All statuses</option>
          {Object.keys(TRANSITIONS).map((s) => (
            <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
          ))}
        </Select>
      </div>

      {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-ink-400">Loading orders…</p>}
      {!loading && orders.length === 0 && <p className="text-ink-400">No orders match this filter.</p>}

      <div className="space-y-3">
        {orders.map((o) => (
          <Card key={o.id}>
            <CardBody>
              <button className="flex w-full flex-wrap items-center justify-between gap-2 text-left" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
                <div>
                  <p className="font-semibold text-ink-900">{o.orderNumber}</p>
                  <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleString()} · {o.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <OrderStatusBadge status={o.status} />
                  <WalletStatusBadge status={o.walletStatus} />
                  <span className="font-semibold text-ink-900">${Number(o.totalUsd).toFixed(2)}</span>
                </div>
              </button>

              {expanded === o.id && (
                <div className="mt-4 space-y-4 border-t border-ink-100 pt-4">
                  <div>
                    <p className="text-sm font-medium text-ink-700">Items</p>
                    <ul className="mt-1 space-y-1 text-sm text-ink-600">
                      {o.items.map((i) => (
                        <li key={i.id} className="flex justify-between">
                          <span>{i.nameSnapshot} × {i.quantity}</span>
                          <span>${Number(i.lineTotalUsd).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-ink-700">Receiver</p>
                    <p className="text-sm text-ink-600">{o.receiverName} · {o.receiverPhone} · {o.deliveryAddress}</p>
                  </div>

                  <div className="flex flex-wrap items-end gap-2">
                    <Select
                      label="Move to status"
                      defaultValue=""
                      onChange={(e) => e.target.value && updateStatus(o.id, e.target.value as OrderStatus)}
                      disabled={busyId === o.id || TRANSITIONS[o.status].length === 0}
                    >
                      <option value="">{TRANSITIONS[o.status].length === 0 ? "No further transitions" : "Select next status…"}</option>
                      {TRANSITIONS[o.status].map((s) => (
                        <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                      ))}
                    </Select>
                  </div>

                  <AssignAndProof order={o} onChanged={load} />
                </div>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AssignAndProof({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const { user } = useAuth();
  const canAssign = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const canUploadProof = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN" || user?.role === "DELIVERY_STAFF";
  const [deliveryStaffId, setDeliveryStaffId] = useState("");
  const [receiverName, setReceiverName] = useState(order.receiverName);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function assign() {
    if (!deliveryStaffId) return;
    setBusy(true);
    try {
      await api.admin.orders.assign(order.id, deliveryStaffId);
      setMsg("Delivery staff assigned.");
      onChanged();
    } finally { setBusy(false); }
  }

  async function uploadProof(e: React.FormEvent) {
    e.preventDefault();
    if (!photos || photos.length === 0) { setMsg("At least one delivery photo is required."); return; }
    setBusy(true);
    const fd = new FormData();
    fd.append("receiverName", receiverName);
    fd.append("deliveryNotes", notes);
    Array.from(photos).forEach((f) => fd.append("photos", f));
    try {
      await api.admin.orders.uploadProof(order.id, fd);
      setMsg("Delivery proof uploaded — wallet hold released.");
      onChanged();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  if (!canAssign && !canUploadProof) return null;

  return (
    <div className="space-y-3 rounded-xl bg-ink-50 p-4">
      <p className="text-sm font-medium text-ink-700">Delivery operations</p>
      {msg && <p className="text-sm text-brand-700">{msg}</p>}

      {canAssign && (
        <div className="flex flex-wrap items-end gap-2">
          <Input label="Delivery staff user ID" placeholder="paste user ID" value={deliveryStaffId} onChange={(e) => setDeliveryStaffId(e.target.value)} />
          <Button type="button" variant="outline" size="sm" disabled={busy} onClick={assign}>Assign</Button>
        </div>
      )}

      {canUploadProof && (
        <form onSubmit={uploadProof} className="flex flex-wrap items-end gap-2">
          <Input label="Receiver name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          <Input label="Delivery notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Input label="Photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Uploading…" : "Upload delivery proof"}</Button>
        </form>
      )}
    </div>
  );
}
