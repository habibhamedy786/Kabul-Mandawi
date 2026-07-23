"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import t, { Lang, LANGUAGES } from "@/lib/i18n/translations";

/* Bazaar-arch mark — the brand glyph used in the header and footer. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M4.75 20.5V12a7.25 7.25 0 0114.5 0v8.5" />
      <path d="M2.5 20.5h19M8.75 20.5V13a3.25 3.25 0 016.5 0v7.5" />
    </svg>
  );
}

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const { itemCount } = useCart();
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();
  const tx = t[lang].nav;
  const home = t[lang].home;

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

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setQuery("");
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-900/10 bg-white/95 backdrop-blur">
      {/* Announcement bar */}
      <div className="bg-brand-900 px-4 py-1.5 text-center text-xs font-medium text-brand-100">
        {tx.announcement}
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-ink-900">
          <BrandMark className="h-7 w-7 text-brand-700" />
          <span className="font-display hidden text-lg font-semibold sm:inline">Kabul Mandawi</span>
        </Link>

        {/* Search — hidden on small screens (the drawer has its own) */}
        <form onSubmit={onSearch} className="hidden min-w-0 flex-1 justify-center md:flex">
          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-ink-200 bg-paper px-3 focus-within:border-brand-500 focus-within:bg-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.8-3.8" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={home.searchPlaceholder}
              className="w-full bg-transparent py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
          </div>
        </form>

        <nav className="hidden shrink-0 items-center gap-5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-ink-700 hover:text-brand-700">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          {/* Language switcher */}
          <div className="hidden items-center rounded-lg border border-ink-200 p-0.5 sm:flex">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code as Lang)}
                className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${lang === l.code ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"}`}
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

          <button className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-ink-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink-100 bg-white px-4 py-4 lg:hidden">
          <form onSubmit={onSearch} className="mb-3 md:hidden">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={home.searchPlaceholder}
              className="w-full rounded-lg border border-ink-200 bg-paper px-3 py-2 text-sm focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </form>
          <nav className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code as Lang); setOpen(false); }}
                  className={`rounded-md px-2.5 py-1 text-sm font-medium ${lang === l.code ? "bg-ink-900 text-white" : "text-ink-500"}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
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
