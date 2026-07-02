"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

function LoginForm() {
  const { login } = useAuth();
  const { lang } = useLang();
  const tx = t[lang].login;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const loggedInUser = await login(email, password);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(redirect);
      } else if (loggedInUser.role === "CUSTOMER") {
        router.push("/");
      } else {
        router.push("/admin");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-1 text-sm text-ink-500">{tx.sub}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label={tx.email} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={tx.password} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-medium text-brand-700">{tx.forgot}</Link>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? tx.loading : tx.btn}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-100" /> OR <span className="h-px flex-1 bg-ink-100" />
      </div>

      <Button variant="outline" size="lg" className="w-full" type="button">
        {tx.google}
      </Button>

      <p className="mt-6 text-center text-sm text-ink-500">
        {tx.noAccount}{" "}<Link href="/register" className="font-medium text-brand-700">{tx.signup}</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
