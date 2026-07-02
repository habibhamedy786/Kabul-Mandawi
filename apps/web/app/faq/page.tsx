"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

export default function FaqPage() {
  const [open, setOpen] = useState<number | null>(0);
  const { lang } = useLang();
  const tx = t[lang].faq;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-ink-900">{tx.heading}</h1>
      <div className="mt-8 divide-y divide-ink-100 rounded-2xl border border-ink-100">
        {tx.items.map((item, i) => (
          <div key={i} className="p-5">
            <button
              className="flex w-full items-center justify-between text-left font-medium text-ink-900"
              onClick={() => setOpen(open === i ? null : i)}
            >
              {item.q}
              <span className="ml-4 text-ink-400">{open === i ? "−" : "+"}</span>
            </button>
            {open === i && <p className="mt-3 text-sm text-ink-600">{item.a}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
