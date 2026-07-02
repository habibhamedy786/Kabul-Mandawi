"use client";

import Link from "next/link";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

export function Footer() {
  const { lang } = useLang();
  const tx = t[lang].footer;
  const legal = t[lang].legal;
  const cats = t[lang].home.cats;

  return (
    <footer className="border-t border-ink-100 bg-ink-900 text-ink-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">KM</span>
              Kabul Mandawi
            </div>
            <p className="mt-3 text-sm text-ink-300">{tx.tagline}</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">{tx.shop}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              {cats.map((c) => (
                <li key={c.slug}><Link href={`/products?category=${c.slug}`} className="hover:text-white">{c.name}</Link></li>
              ))}
              <li><Link href="/custom-request" className="hover:text-white">{tx.customRequest}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">{tx.company}</h4>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white">{tx.aboutUs}</Link></li>
              <li><Link href="/contact" className="hover:text-white">{tx.contactUs}</Link></li>
              <li><Link href="/faq" className="hover:text-white">{tx.faq}</Link></li>
              <li><Link href="/terms" className="hover:text-white">{legal.termsLink}</Link></li>
              <li><Link href="/privacy" className="hover:text-white">{legal.privacyLink}</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white">{legal.refundLink}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white">{tx.trust}</h4>
            <ul className="mt-3 space-y-2 text-sm text-ink-300">
              {tx.trustItems.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-ink-700 pt-6 text-xs text-ink-400">
          {tx.copy(new Date().getFullYear())}
        </div>
      </div>
    </footer>
  );
}
