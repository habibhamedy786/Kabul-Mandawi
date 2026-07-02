"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "TR", name: "Turkey" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "UAE" },
  { code: "SA", name: "Saudi Arabia" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang } = useLang();
  const tx = t[lang].register;
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register({ fullName, email, password, country });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-1 text-sm text-ink-500">{tx.sub}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <Input label={tx.fullName} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label={tx.email} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label={tx.password} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Select label={tx.country} value={country} onChange={(e) => setCountry(e.target.value)}>
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
        </Select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? tx.loading : tx.btn}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        {tx.hasAccount}{" "}<Link href="/login" className="font-medium text-brand-700">{tx.login}</Link>
      </p>
    </div>
  );
}
