"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

interface CustomerRow {
  id: string;
  fullName: string;
  email: string;
  country?: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = `?role=CUSTOMER${search ? `&search=${encodeURIComponent(search)}` : ""}`;
    api.admin.users.list(q).then((d) => setCustomers((d as { users: CustomerRow[] }).users)).finally(() => setLoading(false));
  }, [search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">Customers</h2>
        <Input placeholder="Search by name or email" value={search} onChange={(e) => setSearch(e.target.value)} className="w-64" />
      </div>

      {loading && <p className="text-ink-400">Loading customers…</p>}
      <div className="space-y-2">
        {customers.map((c) => (
          <Card key={c.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900">{c.fullName}</p>
                <p className="text-xs text-ink-400">{c.email} · {c.country ?? "—"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${c.isActive ? "bg-brand-100 text-brand-800" : "bg-ink-200 text-ink-600"}`}>
                {c.isActive ? "Active" : "Inactive"}
              </span>
            </CardBody>
          </Card>
        ))}
        {!loading && customers.length === 0 && <p className="text-ink-400">No customers found.</p>}
      </div>
    </div>
  );
}
