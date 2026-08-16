"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

// Promotional hero banner (your branded graphic) in apps/web/public/.
// Per-language versions fall back to the English one until you add them:
// drop promo-banner-fa.png (Dari) and promo-banner-ps.png (Pashto) in public/.
const PROMO_BANNER = "/promo-banner.png";
const BANNER_BY_LANG: Record<string, string> = {
  en: "/promo-banner.png",
  fa: "/promo-banner-fa.png",
  ps: "/promo-banner-ps.png",
};

/* ── Hand-drawn line icons (24×24, stroke) ─────────────────────────── */

function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const paths: Record<string, React.ReactNode> = {
    groceries: (
      <>
        <path d="M4.5 9.75h15l-1.2 9.3a1.9 1.9 0 01-1.9 1.7H7.6a1.9 1.9 0 01-1.9-1.7l-1.2-9.3z" />
        <path d="M8.25 9.75L12 3.75l3.75 6M9.75 13.5v3.75M14.25 13.5v3.75" />
      </>
    ),
    flowers: (
      <>
        <path d="M12 6.2c-1.4 2.3-3.6 3.1-5.6 3.1 0 3.7 2.3 5.9 5.6 5.9s5.6-2.2 5.6-5.9c-2 0-4.2-.8-5.6-3.1z" />
        <path d="M12 15.2V21M8.6 21h6.8" />
      </>
    ),
    electronics: (
      <>
        <rect x="7.75" y="3.25" width="8.5" height="17.5" rx="2" />
        <path d="M12 17.5h.01" />
      </>
    ),
    clothing: (
      <path d="M9 4.5a3 3 0 006 0h1.5l4 2.75-2 3-2.25-1.1V19a1 1 0 01-1 1H8.75a1 1 0 01-1-1v-9.85L5.5 10.25l-2-3 4-2.75H9z" />
    ),
    gifts: (
      <>
        <path d="M4.25 8.5h15.5v3.75H4.25zM5.5 12.25V19a1.25 1.25 0 001.25 1.25h10.5A1.25 1.25 0 0018.5 19v-6.75M12 8.5v11.75" />
        <path d="M12 8.5c1.6 0 3.4-.6 3.4-2.4 0-1.9-2.4-2.3-3.4-.3-1-2-3.4-1.6-3.4.3 0 1.8 1.8 2.4 3.4 2.4z" />
      </>
    ),
    oil: (
      <>
        <path d="M10 3.5h4v2l1 1.5V19a1.5 1.5 0 01-1.5 1.5h-3A1.5 1.5 0 019 19V7l1-1.5v-2z" />
        <path d="M9.5 12.5h5" />
      </>
    ),
    dairy: (
      <>
        <path d="M7.5 8.5l1.8-4h5.4l1.8 4V19a1.5 1.5 0 01-1.5 1.5H9a1.5 1.5 0 01-1.5-1.5V8.5z" />
        <path d="M7.5 8.5h9M12 4.5v4" />
      </>
    ),
    grains: (
      <>
        <path d="M12 20.5V9" />
        <path d="M12 9c1.6 0 3-1.4 3-3-1.6 0-3 1.4-3 3zM12 9c-1.6 0-3-1.4-3-3 1.6 0 3 1.4 3 3z" />
        <path d="M12 13.5c1.6 0 3-1.4 3-3-1.6 0-3 1.4-3 3zM12 13.5c-1.6 0-3-1.4-3-3 1.6 0 3 1.4 3 3z" />
      </>
    ),
    legumes: (
      <>
        <ellipse cx="9.5" cy="10" rx="2.6" ry="1.7" transform="rotate(-25 9.5 10)" />
        <ellipse cx="14" cy="12.5" rx="2.6" ry="1.7" transform="rotate(20 14 12.5)" />
        <ellipse cx="10" cy="15" rx="2.6" ry="1.7" transform="rotate(-8 10 15)" />
      </>
    ),
    tea: (
      <>
        <path d="M6 9h10v4.5a3.5 3.5 0 01-3.5 3.5h-3A3.5 3.5 0 016 13.5V9z" />
        <path d="M16 10h1.5a1.8 1.8 0 010 3.6H16" />
        <path d="M5.5 20h11" />
        <path d="M9 5.5c-.5.7-.5 1.3 0 2M12 5c-.5.7-.5 1.3 0 2" />
      </>
    ),
    beverages: (
      <>
        <rect x="8.5" y="4" width="7" height="16" rx="1.6" />
        <path d="M8.5 8h7M11 4v2h2V4" />
      </>
    ),
    spices: (
      <>
        <path d="M8 10.5h8V19a1.5 1.5 0 01-1.5 1.5h-5A1.5 1.5 0 018 19v-8.5z" />
        <path d="M8.5 10.5V9a1.5 1.5 0 011.5-1.5h4A1.5 1.5 0 0115.5 9v1.5" />
        <path d="M10.5 6h3M11 13h.01M13 13h.01M12 15h.01" />
      </>
    ),
    fruit: (
      <>
        <path d="M12 8.5c-1.2-1.6-3.6-2-5-.7C5.2 9.4 5.7 13.6 8 16.6c1 1.3 2 2.1 4 2.1s3-.8 4-2.1c2.3-3 2.8-7.2 1-8.8-1.4-1.3-3.8-.9-5 .7z" />
        <path d="M12 8.5V6M12 6c.7-1 2-1.3 2.8-.8" />
      </>
    ),
    bakery: (
      <>
        <path d="M4.5 11.5c0-2.5 3.4-4 7.5-4s7.5 1.5 7.5 4c0 1-.9 1.8-2 1.8H6.5c-1.1 0-2-.8-2-1.8z" />
        <path d="M6.5 13.3V18a1.2 1.2 0 001.2 1.2h8.6A1.2 1.2 0 0017.5 18v-4.7" />
        <path d="M9.5 10.5l-1 2M12.5 10.3l-1 2.2M15 10.8l-1 2" />
      </>
    ),
    honey: (
      <>
        <rect x="8" y="9.5" width="8" height="10.5" rx="1.4" />
        <path d="M8 12.5h8" />
        <path d="M10 9.5V7.5h4v2M11 5h2" />
      </>
    ),
    meat: (
      <>
        <path d="M13.8 5.2a4.2 4.2 0 00-6 5.9L4.6 14.3a1.9 1.9 0 102.7 2.7l3.2-3.2a4.2 4.2 0 003.3-8.6z" />
        <path d="M5.5 16.5L4 18M7 18l-1.5 1.5" />
      </>
    ),
  };

  // Map any category slug (including imported ones like "sunflower-oil" or
  // "dairy-products") to the closest icon by keyword; exact matches win.
  const s = slug.toLowerCase();
  let key = paths[s] ? s : "";
  if (!key) {
    const rules: [string[], string][] = [
      [["flower", "gul"], "flowers"],
      [["oil", "roghan"], "oil"],
      [["dairy", "milk", "cheese", "yogurt", "labaniyat"], "dairy"],
      [["grain", "rice", "flour", "wheat", "staple", "hoboobat"], "grains"],
      [["legume", "bean", "lentil", "chickpea", "pulse"], "legumes"],
      [["tea", "coffee", "chai"], "tea"],
      [["beverage", "drink", "soda", "juice", "water", "energy"], "beverages"],
      [["spice", "masala", "salt", "saffron"], "spices"],
      [["fruit", "nut", "date", "raisin", "dried"], "fruit"],
      [["bak", "bread", "breakfast", "cake", "biscuit", "snack"], "bakery"],
      [["honey", "majoon"], "honey"],
      [["meat", "protein", "chicken", "beef", "gosht"], "meat"],
      [["electronic", "mobile", "phone", "laptop", "gadget", "computer"], "electronics"],
      [["cloth", "wear", "apparel", "poshak"], "clothing"],
      [["gift", "hadya"], "gifts"],
    ];
    for (const [words, k] of rules) {
      if (words.some((w) => s.includes(w))) { key = k; break; }
    }
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[key] ?? paths.groceries}
    </svg>
  );
}

// Colorful tile styling per category (falls back to a neutral tint).
const CAT_STYLES: Record<string, { bg: string; icon: string }> = {
  groceries: { bg: "bg-gradient-to-br from-emerald-100 to-emerald-50", icon: "text-emerald-700" },
  flowers: { bg: "bg-gradient-to-br from-rose-100 to-rose-50", icon: "text-rose-600" },
  electronics: { bg: "bg-gradient-to-br from-sky-100 to-sky-50", icon: "text-sky-700" },
  clothing: { bg: "bg-gradient-to-br from-violet-100 to-violet-50", icon: "text-violet-700" },
  gifts: { bg: "bg-gradient-to-br from-amber-100 to-amber-50", icon: "text-amber-700" },
};
function catStyle(slug: string) {
  return CAT_STYLES[slug] ?? { bg: "bg-gradient-to-br from-ink-100 to-ink-50", icon: "text-ink-700" };
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { lang } = useLang();
  const router = useRouter();
  const tx = t[lang].home;
  const px = t[lang].products;
  const [featured, setFeatured] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.products.list("?featured=true&pageSize=8")
      .then((res) => setFeatured((res as { products: Product[] }).products))
      .catch(() => setFeatured([]));
  }, []);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <div>
      {/* Hero — promotional banner, click to shop */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Reveal>
          <Link
            href="/products"
            aria-label={tx.shopNow}
            className="hover-lift group block overflow-hidden rounded-3xl shadow-xl shadow-brand-900/15 ring-1 ring-black/5"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BANNER_BY_LANG[lang] ?? PROMO_BANNER}
              alt="Kabul Mandawi — fresh products for a better life"
              onError={(e) => {
                // If a language-specific banner isn't uploaded yet, use the English one.
                if (!e.currentTarget.src.endsWith(PROMO_BANNER)) e.currentTarget.src = PROMO_BANNER;
              }}
              className="w-full transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </Link>
        </Reveal>

        {/* Search + category shortcuts under the banner */}
        <Reveal delay={120}>
          <form onSubmit={onSearch} className="mx-auto mt-6 flex max-w-2xl overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tx.searchPlaceholder}
              className="w-full bg-transparent px-4 py-3.5 text-ink-900 placeholder:text-ink-400 focus:outline-none"
            />
            <button type="submit" className="m-1.5 shrink-0 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-700">
              {tx.searchBtn}
            </button>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {tx.cats.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
              >
                <CategoryIcon slug={c.slug} className="h-4 w-4" />
                {c.name}
              </Link>
            ))}
          </div>
        </Reveal>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <Reveal className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink-900">{px.featuredHeading}</h2>
              <p className="mt-1.5 text-ink-500">{px.featuredSub}</p>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 sm:block">
              {px.viewAll} →
            </Link>
          </Reveal>
          <Reveal className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </Reveal>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="text-sm font-semibold text-brand-700">{px.viewAll} →</Link>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="border-y border-ink-900/5 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-3xl font-semibold text-ink-900">{tx.categories.heading}</h2>
            <p className="mt-1.5 text-ink-500">{tx.categories.sub}</p>
          </Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {tx.cats.map((c, i) => {
              const style = catStyle(c.slug);
              return (
                <Reveal key={c.slug} delay={i * 60} className="aspect-square">
                  <Link
                    href={`/products?category=${c.slug}`}
                    className={`hover-lift group flex h-full w-full flex-col items-center justify-center gap-4 rounded-2xl ${style.bg} p-6 text-center ring-1 ring-black/5`}
                  >
                    <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/80 shadow-sm ${style.icon} transition-transform duration-300 group-hover:scale-110`}>
                      <CategoryIcon slug={c.slug} className="h-8 w-8" />
                    </span>
                    <span className="font-semibold text-ink-900">{c.name}</span>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-ink-900">{tx.how.heading}</h2>
          <p className="mt-1.5 text-ink-500">{tx.how.sub}</p>
        </Reveal>
        <Reveal>
        <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
          {tx.how.steps.map((step, i) => (
            <li key={step.title} className="relative border-t-2 border-ink-900/10 pt-5">
              <span className="font-display absolute -top-0.5 h-0.5 w-10 bg-saffron-500" aria-hidden="true" />
              <span className="font-display text-sm font-semibold text-saffron-600">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-1 text-lg font-semibold text-ink-900">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{step.desc}</p>
            </li>
          ))}
        </ol>
        </Reveal>
      </section>

      {/* Custom-request CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 text-center sm:px-12">
          <span className="mx-auto block h-0.5 w-12 bg-saffron-500" aria-hidden="true" />
          <h2 className="font-display mx-auto mt-6 max-w-2xl text-3xl font-semibold text-white">{tx.cta.heading}</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-300">{tx.cta.sub}</p>
          <div className="mt-8">
            <Link href="/products">
              <Button size="lg" className="shadow-lg shadow-black/20">{tx.cta.btn}</Button>
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
