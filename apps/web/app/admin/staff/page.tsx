"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Role } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface StaffRow {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  phone?: string;
  isActive: boolean;
}

// Positions a staff member can hold — CUSTOMER is intentionally excluded so
// staff and customers stay permanently separate.
const POSITIONS: { value: Role; label: string }[] = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "OPERATIONS_MANAGER", label: "Operations Manager" },
  { value: "INVENTORY_MANAGER", label: "Inventory Manager" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "DELIVERY_COORDINATOR", label: "Delivery Coordinator" },
  { value: "MARKETING_MANAGER", label: "Marketing Manager" },
  { value: "PROCUREMENT_OFFICER", label: "Procurement Officer" },
  { value: "DELIVERY_STAFF", label: "Delivery Staff" },
  { value: "CUSTOMER_SUPPORT", label: "Customer Support" },
];

const positionLabel = (r: Role) => POSITIONS.find((p) => p.value === r)?.label ?? r.replaceAll("_", " ");

export default function AdminStaffPage() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER_SUPPORT");
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // password reset (per-staff inline)
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  // edit details (per-staff inline)
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editMsg, setEditMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function load() {
    setLoading(true);
    api.admin.staff.list()
      .then((d) => setStaff((d as { users: StaffRow[] }).users))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") load();
    else if (user) setLoading(false);
  }, [user]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    try {
      await api.admin.staff.create({ fullName, email, password, role, phone: phone || undefined });
      setCreateMsg({ type: "ok", text: `${fullName} added as ${positionLabel(role)}.` });
      setFullName(""); setEmail(""); setPhone(""); setPassword(""); setRole("CUSTOMER_SUPPORT");
      load();
    } catch (err) {
      setCreateMsg({ type: "err", text: err instanceof Error ? err.message : "Could not create staff member." });
    } finally {
      setCreating(false);
    }
  }

  async function changeRole(id: string, newRole: Role) {
    await api.admin.staff.updateRole(id, newRole);
    load();
  }

  async function toggleActive(s: StaffRow) {
    await api.admin.staff.setActive(s.id, !s.isActive);
    load();
  }

  async function savePassword(id: string) {
    if (resetPw.length < 8) { setResetMsg("Password must be at least 8 characters."); return; }
    await api.admin.staff.setPassword(id, resetPw);
    setResetMsg("Password updated.");
    setResetPw("");
    setResetId(null);
    setTimeout(() => setResetMsg(null), 2500);
  }

  function startEditStaff(s: StaffRow) {
    setEditId(editId === s.id ? null : s.id);
    setEditName(s.fullName);
    setEditEmail(s.email);
    setEditPhone(s.phone ?? "");
    setEditMsg(null);
  }

  async function saveStaffEdit(id: string) {
    setEditMsg(null);
    try {
      await api.admin.staff.update(id, { fullName: editName, email: editEmail.trim(), phone: editPhone || undefined });
      setEditId(null);
      load();
    } catch (err) {
      setEditMsg({ type: "err", text: err instanceof Error ? err.message : "Could not update staff member." });
    }
  }

  if (user && user.role !== "SUPER_ADMIN") {
    return (
      <div className="rounded-2xl border border-ink-100 p-8 text-center">
        <h2 className="text-lg font-semibold text-ink-900">Super Admin only</h2>
        <p className="mt-2 text-sm text-ink-500">Only the Super Admin can create and manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Staff</h2>
        <p className="text-sm text-ink-500">Create staff accounts, set their position, and manage their passwords. Customers are managed separately.</p>
      </div>

      {/* Create staff */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-ink-900">Add a staff member</h3>
          <form onSubmit={handleCreate} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Select label="Position" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </Select>
            <Input label="Temporary password" type="text" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            <div className="flex items-end">
              <Button type="submit" disabled={creating} className="w-full sm:w-auto">
                {creating ? "Adding…" : "Add staff member"}
              </Button>
            </div>
          </form>
          {createMsg && (
            <p className={`mt-3 text-sm ${createMsg.type === "ok" ? "text-brand-700" : "text-red-600"}`}>{createMsg.text}</p>
          )}
        </CardBody>
      </Card>

      {/* Staff list */}
      <div className="space-y-2">
        <h3 className="font-semibold text-ink-900">Current staff</h3>
        {loading && <p className="text-ink-400">Loading staff…</p>}
        {!loading && staff.length === 0 && <p className="text-ink-400">No staff members yet.</p>}

        {staff.map((s) => (
          <Card key={s.id}>
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-ink-900">{s.fullName}</p>
                  <p className="text-xs text-ink-400">{s.email}{s.phone ? ` · ${s.phone}` : ""}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={s.role} onChange={(e) => changeRole(s.id, e.target.value as Role)} className="w-48">
                    {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => startEditStaff(s)}>
                    {editId === s.id ? "Cancel" : "Edit"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setResetId(resetId === s.id ? null : s.id); setResetPw(""); setResetMsg(null); }}>
                    {resetId === s.id ? "Cancel" : "Reset password"}
                  </Button>
                  <Button size="sm" variant={s.isActive ? "outline" : "primary"} onClick={() => toggleActive(s)}>
                    {s.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>

              {editId === s.id && (
                <div className="space-y-2 rounded-xl bg-ink-50 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Input label="Full name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                    <Input label="Email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                    <Input label="Phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
                  </div>
                  {editMsg && <p className={`text-sm ${editMsg.type === "ok" ? "text-brand-700" : "text-red-600"}`}>{editMsg.text}</p>}
                  <Button size="sm" onClick={() => saveStaffEdit(s.id)}>Save changes</Button>
                </div>
              )}

              {resetId === s.id && (
                <div className="flex flex-wrap items-end gap-2 rounded-xl bg-ink-50 p-3">
                  <Input label="New password" type="text" minLength={8} value={resetPw} onChange={(e) => setResetPw(e.target.value)} placeholder="At least 8 characters" className="w-64" />
                  <Button size="sm" onClick={() => savePassword(s.id)}>Save password</Button>
                </div>
              )}
            </CardBody>
          </Card>
        ))}
        {resetMsg && <p className="text-sm text-brand-700">{resetMsg}</p>}
      </div>
    </div>
  );
}
