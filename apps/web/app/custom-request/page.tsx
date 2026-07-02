"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { api } from "@/lib/api";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { DeliveryCity } from "@/lib/types";
import t from "@/lib/i18n/translations";

export default function CustomRequestPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const tx = t[lang].customRequest;
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState<DeliveryCity>("KABUL");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { router.push("/login?redirect=/custom-request"); return; }

    setSubmitting(true);
    setError(null);
    try {
      await api.customRequests.create({ title, description, city, receiverName, receiverPhone, receiverAddress });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit your request.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink-900">{tx.successHeading}</h1>
        <p className="mt-3 text-ink-600">{tx.successSub}</p>
        <Button className="mt-6" onClick={() => router.push("/dashboard")}>{tx.dashboard}</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-2 text-ink-600">{tx.sub}</p>

      <Card className="mt-4">
        <CardBody>
          <p className="text-sm font-medium text-ink-700">{tx.examples}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-ink-500">
            {tx.exampleList.map((ex) => <li key={ex}>{ex}</li>)}
          </ul>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label={tx.titleLabel} required placeholder={tx.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label={tx.descLabel} required rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={tx.receiverName} required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
          <Input label={tx.receiverPhone} required value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
          <Select label={tx.city} value={city} onChange={(e) => setCity(e.target.value as DeliveryCity)}>
            <option value="KABUL">Kabul</option>
            <option value="HERAT" disabled>Herat (coming soon)</option>
            <option value="MAZAR_I_SHARIF" disabled>Mazar-i-Sharif (coming soon)</option>
          </Select>
          <div className="sm:col-span-2">
            <Input label={tx.receiverAddress} required value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" disabled={submitting}>{submitting ? tx.submitting : tx.submit}</Button>
      </form>
    </div>
  );
}
