"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useLang } from "@/context/LanguageContext";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { lang } = useLang();
  const tx = t[lang].contact;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.contact.send({ name, email, message });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send your message.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-3 text-ink-600">{tx.sub}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-ink-100 p-6 sm:grid-cols-2">
        <div>
          <p className="text-sm font-medium text-ink-500">{tx.emailLabel}</p>
          <p className="text-ink-900">support@kabulmandawi.com</p>
        </div>
        <div>
          <p className="text-sm font-medium text-ink-500">{tx.hoursLabel}</p>
          <p className="text-ink-900">{tx.hours}</p>
        </div>
      </div>

      {sent ? (
        <div className="mt-8 rounded-2xl bg-brand-50 p-6 text-brand-800">{tx.sent}</div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input label={tx.nameField} required value={name} onChange={(e) => setName(e.target.value)} />
          <Input label={tx.emailField} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Textarea label={tx.messageField} required rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>{tx.send}</Button>
        </form>
      )}
    </div>
  );
}
