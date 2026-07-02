"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

export default function SettingsPage() {
  const { user, refreshUser, logout } = useAuth();
  const { lang } = useLang();
  const tx = t[lang].dashboard.settings;
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await api.users.updateMe({ fullName, phone });
      await refreshUser();
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody>
          <h2 className="font-semibold text-ink-900">{tx.heading}</h2>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <Input label={tx.fullName} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label={tx.phone} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input label={tx.email} value={user?.email ?? ""} disabled />
            {saved && <p className="text-sm text-brand-700">{tx.saved}</p>}
            <Button type="submit" disabled={saving}>{saving ? tx.saving : tx.save}</Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-center justify-between">
          <div>
            <p className="font-medium text-ink-900">{tx.logoutHeading}</p>
            <p className="text-sm text-ink-500">{tx.logoutSub}</p>
          </div>
          <Button variant="outline" onClick={logout}>{tx.logout}</Button>
        </CardBody>
      </Card>
    </div>
  );
}
