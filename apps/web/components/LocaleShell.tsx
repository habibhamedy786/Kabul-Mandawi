"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useLang } from "@/context/LanguageContext";

export function LocaleShell({ children }: { children: React.ReactNode }) {
  const { dir, lang } = useLang();

  useEffect(() => {
    document.documentElement.setAttribute("dir", dir);
    document.documentElement.setAttribute("lang", lang);
  }, [dir, lang]);

  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
