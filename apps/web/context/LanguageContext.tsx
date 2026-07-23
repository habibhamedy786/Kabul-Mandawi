"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Lang, LANGUAGES } from "@/lib/i18n/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  dir: "ltr" | "rtl";
}

// Default to Dari (fa) — most visitors read Persian; they can switch anytime
// and their choice is remembered.
const LanguageContext = createContext<LanguageContextValue>({ lang: "fa", setLang: () => {}, dir: "rtl" });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fa");

  useEffect(() => {
    const saved = localStorage.getItem("afc_lang") as Lang | null;
    if (saved && ["en", "fa", "ps"].includes(saved)) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("afc_lang", l);
  }

  const dir = LANGUAGES.find((x) => x.code === lang)?.dir ?? "ltr";

  return (
    <LanguageContext.Provider value={{ lang, setLang, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
