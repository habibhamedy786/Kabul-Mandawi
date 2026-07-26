"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";

// Afghanistan is pinned first; the rest are alphabetical. Flags are emoji so
// they render on phones without any image assets.
const COUNTRIES = [
  { code: "AF", flag: "🇦🇫", name: "Afghanistan" },
  { code: "AU", flag: "🇦🇺", name: "Australia" },
  { code: "AT", flag: "🇦🇹", name: "Austria" },
  { code: "BE", flag: "🇧🇪", name: "Belgium" },
  { code: "CA", flag: "🇨🇦", name: "Canada" },
  { code: "CN", flag: "🇨🇳", name: "China" },
  { code: "DK", flag: "🇩🇰", name: "Denmark" },
  { code: "FI", flag: "🇫🇮", name: "Finland" },
  { code: "FR", flag: "🇫🇷", name: "France" },
  { code: "DE", flag: "🇩🇪", name: "Germany" },
  { code: "IN", flag: "🇮🇳", name: "India" },
  { code: "IR", flag: "🇮🇷", name: "Iran" },
  { code: "IQ", flag: "🇮🇶", name: "Iraq" },
  { code: "IE", flag: "🇮🇪", name: "Ireland" },
  { code: "IT", flag: "🇮🇹", name: "Italy" },
  { code: "JP", flag: "🇯🇵", name: "Japan" },
  { code: "KZ", flag: "🇰🇿", name: "Kazakhstan" },
  { code: "MY", flag: "🇲🇾", name: "Malaysia" },
  { code: "NL", flag: "🇳🇱", name: "Netherlands" },
  { code: "NZ", flag: "🇳🇿", name: "New Zealand" },
  { code: "NO", flag: "🇳🇴", name: "Norway" },
  { code: "PK", flag: "🇵🇰", name: "Pakistan" },
  { code: "QA", flag: "🇶🇦", name: "Qatar" },
  { code: "RU", flag: "🇷🇺", name: "Russia" },
  { code: "SA", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "SG", flag: "🇸🇬", name: "Singapore" },
  { code: "ZA", flag: "🇿🇦", name: "South Africa" },
  { code: "KR", flag: "🇰🇷", name: "South Korea" },
  { code: "ES", flag: "🇪🇸", name: "Spain" },
  { code: "SE", flag: "🇸🇪", name: "Sweden" },
  { code: "CH", flag: "🇨🇭", name: "Switzerland" },
  { code: "TJ", flag: "🇹🇯", name: "Tajikistan" },
  { code: "TR", flag: "🇹🇷", name: "Turkey" },
  { code: "TM", flag: "🇹🇲", name: "Turkmenistan" },
  { code: "AE", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "GB", flag: "🇬🇧", name: "United Kingdom" },
  { code: "US", flag: "🇺🇸", name: "United States" },
  { code: "UZ", flag: "🇺🇿", name: "Uzbekistan" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const { lang } = useLang();
  const tx = t[lang].register;
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("AF");
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
          {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
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
