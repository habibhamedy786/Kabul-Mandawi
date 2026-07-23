"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

// Hero photo: the Afghan bazaar-at-sunset photo in apps/web/public/landmarks/.
const HERO_PHOTO = "/landmarks/hero-bg.jpg";

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
  };
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[slug] ?? paths.groceries}
    </svg>
  );
}

function TrustIcon({ index, className }: { index: number; className?: string }) {
  const icons: React.ReactNode[] = [
    // 0 — secure card payments
    <>
      <rect x="2.5" y="5.25" width="19" height="13.5" rx="1.75" />
      <path d="M2.5 9.25h19M5.5 14.5h4.5" />
    </>,
    // 1 — wallet hold protection
    <>
      <path d="M12 3l7.5 3v5.1c0 4.5-3 8.4-7.5 9.9-4.5-1.5-7.5-5.4-7.5-9.9V6L12 3z" />
      <path d="M9.25 12.25l2 2 3.5-4.25" />
    </>,
    // 2 — delivery truck
    <>
      <path d="M2.75 6.25h11v10.5h-11zM13.75 9.25h3.9c.5 0 .96.24 1.24.65l2.1 3.03c.17.25.26.55.26.85v3h-2.5" />
      <circle cx="7" cy="17.75" r="1.75" />
      <circle cx="17" cy="17.75" r="1.75" />
      <path d="M8.75 17.75h6.5" />
    </>,
    // 3 — photo delivery proof
    <>
      <path d="M3.25 8.25c0-.97.7-1.8 1.66-1.9.62-.07 1.24-.13 1.87-.18l.9-1.62c.3-.55.87-.9 1.5-.93a41 41 0 015.64 0c.63.03 1.2.38 1.5.93l.9 1.62c.63.05 1.25.11 1.87.18.96.1 1.66.93 1.66 1.9v9.5a2 2 0 01-2 2H5.25a2 2 0 01-2-2v-9.5z" />
      <circle cx="12" cy="13" r="3.25" />
    </>,
    // 4 — real customer support
    <>
      <path d="M4.25 10.5a7.75 7.75 0 0115.5 0" />
      <rect x="2.75" y="10.5" width="3.75" height="6" rx="1.5" />
      <rect x="17.5" y="10.5" width="3.75" height="6" rx="1.5" />
      <path d="M19.75 16.5v1.25a2.5 2.5 0 01-2.5 2.5H13.5" />
    </>,
  ];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {icons[index % icons.length]}
    </svg>
  );
}

/* ── Page ──────────────────────────────────────────────────────────── */

export default function HomePage() {
  const { lang } = useLang();
  const router = useRouter();
  const tx = t[lang].home;
  const px = t[lang].products;
  const [heroImgOk, setHeroImgOk] = useState(true);
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
      {/* Hero — split editorial layout on warm paper */}
      <section className="border-b border-ink-900/5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:py-20 lg:px-8">
          <div className="lg:col-span-6">
            <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-brand-700">
              <span className="inline-block h-px w-8 bg-saffron-500" aria-hidden="true" />
              {tx.badge}
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold text-ink-900 sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
              {tx.headline}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">{tx.sub}</p>

            {/* Search — the primary action */}
            <form onSubmit={onSearch} className="mt-8 flex max-w-lg overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
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

            {/* Category quick links */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              {tx.cats.map((c) => (
                <Link
                  key={c.slug}
                  href={`/products?category=${c.slug}`}
                  className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm text-ink-700 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Framed market photograph */}
          <div className="lg:col-span-6">
            {heroImgOk && (
              <div className="relative overflow-hidden rounded-2xl bg-ink-100 ring-1 ring-ink-900/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={HERO_PHOTO}
                  alt=""
                  onError={() => setHeroImgOk(false)}
                  className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                />
                {/* Afghan flag accent along the photo base — dir=ltr keeps the
                    black-red-green order correct in RTL languages too */}
                <div dir="ltr" className="absolute bottom-0 left-0 flex h-1.5 w-full" aria-hidden="true">
                  <span className="flex-1 bg-ink-900" />
                  <span className="flex-1 bg-red-700" />
                  <span className="flex-1 bg-brand-700" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Trust band */}
      <section className="border-b border-ink-900/5 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-6 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-5 lg:px-8">
          {tx.features.map((f, i) => (
            <div key={f.title} className="flex gap-3.5">
              <TrustIcon index={i} className="h-6 w-6 shrink-0 text-brand-700" />
              <div>
                <h3 className="text-sm font-semibold text-ink-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold text-ink-900">{px.featuredHeading}</h2>
              <p className="mt-1.5 text-ink-500">{px.featuredSub}</p>
            </div>
            <Link href="/products" className="hidden text-sm font-semibold text-brand-700 hover:text-brand-800 sm:block">
              {px.viewAll} →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link href="/products" className="text-sm font-semibold text-brand-700">{px.viewAll} →</Link>
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="border-y border-ink-900/5 bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink-900">{tx.categories.heading}</h2>
          <p className="mt-1.5 text-ink-500">{tx.categories.sub}</p>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {tx.cats.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="group flex flex-col items-center gap-3 rounded-xl border border-ink-100 bg-paper p-6 text-center transition-colors hover:border-brand-300 hover:bg-brand-50/60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-700 ring-1 ring-ink-900/10 transition-colors group-hover:text-brand-700">
                  <CategoryIcon slug={c.slug} className="h-6 w-6" />
                </span>
                <span className="font-medium text-ink-800">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl font-semibold text-ink-900">{tx.how.heading}</h2>
          <p className="mt-1.5 text-ink-500">{tx.how.sub}</p>
        </div>
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
      </section>

      {/* Custom-request CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-ink-900 px-6 py-14 text-center sm:px-12">
          <span className="mx-auto block h-0.5 w-12 bg-saffron-500" aria-hidden="true" />
          <h2 className="font-display mx-auto mt-6 max-w-2xl text-3xl font-semibold text-white">{tx.cta.heading}</h2>
          <p className="mx-auto mt-4 max-w-xl leading-relaxed text-ink-300">{tx.cta.sub}</p>
          <div className="mt-8">
            <Link href="/custom-request">
              <Button size="lg" className="shadow-lg shadow-black/20">{tx.cta.btn}</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
