"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useLang } from "@/context/LanguageContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

function ResetForm() {
  const { lang } = useLang();
  const tx = t[lang].resetPw;
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError(tx.mismatch); return; }

    setSubmitting(true);
    try {
      await api.auth.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : tx.invalid);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{tx.heading}</h1>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-brand-50 p-5 text-sm text-brand-800">{tx.success}</div>
          <Link href="/login"><Button size="lg" className="w-full">{tx.goLogin}</Button></Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input label={tx.password} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label={tx.confirm} type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !token}>
            {submitting ? tx.saving : tx.btn}
          </Button>
          {!token && <p className="text-sm text-red-600">{tx.invalid}</p>}
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
