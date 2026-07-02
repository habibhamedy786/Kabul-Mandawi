"use client";

import { useState } from "react";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

// Banner photo: Afghan women in traditional dress, walking through a village
// market. Lives in apps/web/public/landmarks/afghan-clothes.jpg — the banner
// hides itself gracefully if the file is ever missing.
const ABOUT_PHOTO = "/landmarks/afghan-clothes.jpg";

export default function AboutPage() {
  const { lang } = useLang();
  const tx = t[lang].about;
  const [imgOk, setImgOk] = useState(true);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      {imgOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ABOUT_PHOTO}
          alt=""
          onError={() => setImgOk(false)}
          className="animate-fade-in mb-10 aspect-[2/1] w-full rounded-2xl object-cover shadow-md"
        />
      )}
      <h1 className="animate-fade-in-up text-3xl font-bold text-ink-900">{tx.heading}</h1>
      <p className="mt-6 text-ink-600">{tx.p1}</p>
      <p className="mt-4 text-ink-600">{tx.p2}</p>
      <h2 className="mt-10 text-xl font-semibold text-ink-900">{tx.moneyHeading}</h2>
      <p className="mt-3 text-ink-600">{tx.moneyP}</p>
      <h2 className="mt-10 text-xl font-semibold text-ink-900">{tx.teamHeading}</h2>
      <p className="mt-3 text-ink-600">{tx.teamP}</p>
    </div>
  );
}
