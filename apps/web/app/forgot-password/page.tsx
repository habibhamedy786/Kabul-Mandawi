"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useLang } from "@/context/LanguageContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

export default function ForgotPasswordPage() {
  const { lang } = useLang();
  const tx = t[lang].forgotPw;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.auth.forgotPassword(email);
      setSent(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-1 text-sm text-ink-500">{tx.sub}</p>

      {sent ? (
        <div className="mt-6 rounded-2xl bg-brand-50 p-5 text-sm text-brand-800">{tx.sent}</div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label={tx.email} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? tx.sending : tx.btn}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="font-medium text-brand-700">{tx.back}</Link>
      </p>
    </div>
  );
}
