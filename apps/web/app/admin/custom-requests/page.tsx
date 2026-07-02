"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { CustomRequest } from "@/lib/types";
import { CustomRequestStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminCustomRequestsPage() {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    api.admin.customRequests.list(q).then((r) => setRequests(r as CustomRequest[])).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-ink-900">Custom requests</h2>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-56">
          <option value="">All statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="QUOTED">Quoted</option>
          <option value="CONVERTED_TO_ORDER">Converted to order</option>
          <option value="DECLINED">Declined</option>
        </Select>
      </div>

      {loading && <p className="text-ink-400">Loading requests…</p>}
      {!loading && requests.length === 0 && <p className="text-ink-400">No custom requests match this filter.</p>}

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestCard key={r.id} request={r} onChanged={load} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({ request, onChanged }: { request: CustomRequest; onChanged: () => void }) {
  const { user } = useAuth();
  const canQuoteOrConvert = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const [quote, setQuote] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function sendQuote() {
    if (!quote) return;
    setBusy(true); setMsg("");
    try {
      await api.admin.customRequests.quote(request.id, { quotedAmountUsd: Number(quote), quoteNote: note || undefined });
      setMsg("Quote sent to customer.");
      onChanged();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not send quote.");
    } finally { setBusy(false); }
  }

  async function convert() {
    setBusy(true); setMsg("");
    try {
      await api.admin.customRequests.convert(request.id);
      setMsg("Converted to an order awaiting payment.");
      onChanged();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Could not convert request.");
    } finally { setBusy(false); }
  }

  async function decline() {
    setBusy(true); setMsg("");
    try {
      await api.admin.customRequests.decline(request.id, note || undefined);
      setMsg("Request declined.");
      onChanged();
    } finally { setBusy(false); }
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-ink-900">{request.title}</p>
            <p className="text-xs text-ink-400">{request.city} · {request.receiverName} · {request.receiverPhone}</p>
          </div>
          <CustomRequestStatusBadge status={request.status} />
        </div>
        <p className="text-sm text-ink-600">{request.description}</p>
        {request.quotedAmountUsd && (
          <p className="text-sm text-ink-700">Quoted: <strong>${Number(request.quotedAmountUsd).toFixed(2)}</strong> {request.quoteNote && `— ${request.quoteNote}`}</p>
        )}

        {msg && <p className="text-sm text-brand-700">{msg}</p>}

        {request.status !== "CONVERTED_TO_ORDER" && request.status !== "DECLINED" && (
          <div className="flex flex-wrap items-end gap-2">
            {canQuoteOrConvert && (
              <>
                <Input label="Quote amount (USD)" type="number" step="0.01" value={quote} onChange={(e) => setQuote(e.target.value)} />
                <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
                <Button size="sm" variant="outline" disabled={busy} onClick={sendQuote}>Send quote</Button>
                {request.status === "QUOTED" && (
                  <Button size="sm" disabled={busy} onClick={convert}>Convert to order</Button>
                )}
              </>
            )}
            <Button size="sm" variant="danger" disabled={busy} onClick={decline}>Decline</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
