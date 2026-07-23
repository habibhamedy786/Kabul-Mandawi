"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminAccountPage() {
  const { user, refreshUser } = useAuth();

  // ── Profile (name + sign-in email) ──────────────────────────────
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // ── Password ────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSavingProfile(true);
    try {
      await api.users.updateMe({ fullName, email: email.trim() });
      await refreshUser();
      setProfileMsg({ type: "ok", text: "Your details have been updated." });
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof Error ? err.message : "Could not update your details." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword.length < 8) { setMsg({ type: "err", text: "New password must be at least 8 characters." }); return; }
    if (newPassword !== confirm) { setMsg({ type: "err", text: "New password and confirmation do not match." }); return; }

    setSubmitting(true);
    try {
      await api.users.changePassword({ currentPassword, newPassword });
      setMsg({ type: "ok", text: "Your password has been updated." });
      setCurrentPassword(""); setNewPassword(""); setConfirm("");
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Could not change your password." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">My Account</h2>
        <p className="text-sm text-ink-500">{user?.fullName} · {user?.email}</p>
      </div>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-ink-900">Profile</h3>
          <p className="mt-1 text-sm text-ink-500">
            Your sign-in email is the address you use to log in. It doesn&apos;t have to match the
            address customers see on emails.
          </p>
          <form onSubmit={handleProfileSubmit} className="mt-4 max-w-sm space-y-4">
            <Input label="Full name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Sign-in email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            {profileMsg && <p className={`text-sm ${profileMsg.type === "ok" ? "text-brand-700" : "text-red-600"}`}>{profileMsg.text}</p>}
            <Button type="submit" disabled={savingProfile}>{savingProfile ? "Saving…" : "Save details"}</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h3 className="font-semibold text-ink-900">Change password</h3>
          <form onSubmit={handleSubmit} className="mt-4 max-w-sm space-y-4">
            <Input label="Current password" type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            <Input label="New password" type="password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" />
            <Input label="Confirm new password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            {msg && <p className={`text-sm ${msg.type === "ok" ? "text-brand-700" : "text-red-600"}`}>{msg.text}</p>}
            <Button type="submit" disabled={submitting}>{submitting ? "Saving…" : "Update password"}</Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
