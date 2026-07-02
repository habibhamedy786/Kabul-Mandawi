"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Order } from "@/lib/types";
import { OrderStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function MyDeliveriesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.delivery.myAssignments().then((o) => setOrders(o as Order[])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="text-ink-400">Loading your assignments…</div>;
  if (orders.length === 0) return <div className="text-ink-400">No deliveries currently assigned to you.</div>;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-ink-900">My deliveries</h2>
      {orders.map((o) => (
        <DeliveryCard key={o.id} order={o} onDelivered={load} />
      ))}
    </div>
  );
}

function DeliveryCard({ order, onDelivered }: { order: Order; onDelivered: () => void }) {
  const [receiverName, setReceiverName] = useState(order.receiverName);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

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
      setMsg("Marked delivered. Wallet hold released.");
      onDelivered();
    } catch (err) {
      setMsg(err instanceof ApiError ? err.message : "Upload failed.");
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">{order.orderNumber}</p>
            <p className="text-xs text-ink-400">{order.city} · {order.deliveryAddress}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-ink-600">Receiver: {order.receiverName} · {order.receiverPhone}</p>

        {msg && <p className="text-sm text-brand-700">{msg}</p>}
        <form onSubmit={uploadProof} className="flex flex-wrap items-end gap-2">
          <Input label="Receiver name" value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          <Input label="Delivery notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Input label="Photos" type="file" accept="image/*" multiple onChange={(e) => setPhotos(e.target.files)} />
          <Button type="submit" size="sm" disabled={busy}>{busy ? "Uploading…" : "Mark delivered"}</Button>
        </form>
      </CardBody>
    </Card>
  );
}
