"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { lang } = useLang();
  const tx = t[lang].dashboard;

  const LINKS = [
    { href: "/dashboard", label: tx.nav.overview },
    { href: "/dashboard/orders", label: tx.nav.orders },
    { href: "/dashboard/wallet", label: tx.nav.wallet },
    { href: "/dashboard/addresses", label: tx.nav.addresses },
    { href: "/dashboard/settings", label: tx.nav.settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink-900">{tx.title}</h1>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col gap-1 rounded-2xl border border-ink-100 p-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  pathname === l.href ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="lg:col-span-3">{children}</div>
      </div>
    </div>
  );
}
