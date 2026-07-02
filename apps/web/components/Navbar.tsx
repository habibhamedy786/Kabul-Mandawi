"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import t, { Lang, LANGUAGES } from "@/lib/i18n/translations";

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const tx = t[lang].nav;

  // Close the mobile menu whenever the route changes, no matter which
  // link triggered the navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  const NAV_LINKS = [
    { href: "/products", label: tx.shop },
    { href: "/custom-request", label: tx.customRequest },
    { href: "/about", label: tx.about },
    { href: "/contact", label: tx.contact },
    { href: "/faq", label: tx.faq },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/95 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-ink-900 px-4 py-1.5 text-center text-xs font-medium text-ink-200">
        {tx.announcement}
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">KM</span>
          <span className="hidden sm:inline">Kabul Mandawi</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-ink-700 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <div className="hidden items-center gap-1 sm:flex">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`rounded px-2 py-1 text-xs font-medium transition-colors ${lang === l.code ? "bg-brand-600 text-white" : "text-ink-500 hover:text-brand-700"}`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <Link href="/cart" className="relative flex items-center text-ink-700 hover:text-brand-700">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.94-4.518 2.448-6.66.124-.521-.27-1.02-.804-1.02H5.85m1.65 7.68L5.106 5.272M7.5 14.25L5.106 5.272M14.25 9.75v-.75A2.25 2.25 0 0012 6.75H9.75" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {!loading && (user ? (
            <div className="hidden items-center gap-3 sm:flex">
              <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"} className="text-sm font-medium text-ink-700 hover:text-brand-700">
                {user.role === "CUSTOMER" ? tx.dashboard : tx.admin}
              </Link>
              <Button variant="outline" size="sm" onClick={logout}>{tx.logout}</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login"><Button variant="ghost" size="sm">{tx.login}</Button></Link>
              <Link href="/register"><Button size="sm">{tx.signup}</Button></Link>
            </div>
          ))}

          <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ink-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-3">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code as Lang); setOpen(false); }}
                className={`text-left text-sm font-medium ${lang === l.code ? "text-brand-700" : "text-ink-500"}`}
              >
                {l.label}
              </button>
            ))}
            <hr className="border-ink-100" />
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-ink-700" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href={user.role === "CUSTOMER" ? "/dashboard" : "/admin"} className="text-sm font-medium text-ink-700" onClick={() => setOpen(false)}>{tx.dashboard}</Link>
                <button onClick={() => { logout(); setOpen(false); }} className="text-left text-sm font-medium text-red-600">{tx.logout}</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-ink-700" onClick={() => setOpen(false)}>{tx.login}</Link>
                <Link href="/register" className="text-sm font-medium text-brand-700" onClick={() => setOpen(false)}>{tx.signup}</Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
