"use client";

import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

/** Shared renderer for the Terms / Privacy / Refund policy pages. */
export function LegalPage({ doc }: { doc: "terms" | "privacy" | "refund" }) {
  const { lang } = useLang();
  const legal = t[lang].legal;
  const page = legal[doc];

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-ink-900">{page.title}</h1>
      <p className="mt-2 text-sm text-ink-400">{legal.updated}</p>
      <div className="mt-8 space-y-8">
        {page.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-lg font-semibold text-ink-900">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-ink-600">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
