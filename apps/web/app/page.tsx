"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { Lightbox } from "@/components/Lightbox";
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
  const [lightbox, setLightbox] = useState(false);

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
      {/* Hero — bold storefront promo banner */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 via-brand-700 to-brand-800 px-6 py-12 shadow-xl shadow-brand-900/20 sm:px-10 lg:px-14 lg:py-16">
          {/* soft decorative glows for depth */}
          <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-saffron-400/25 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-brand-400/25 blur-3xl" />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
            {/* Copy */}
            <div className="lg:col-span-6">
              <Reveal>
                <p className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-saffron-300">
                  <span className="inline-block h-px w-8 bg-saffron-400" aria-hidden="true" />
                  {tx.badge}
                </p>
              </Reveal>
              <Reveal delay={80}>
                <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-[3.4rem]">
                  {tx.headline}
                </h1>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-5 max-w-lg text-lg leading-relaxed text-white/85">{tx.sub}</p>
              </Reveal>

              <Reveal delay={240}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link href="/products">
                    <Button size="lg" className="w-full bg-saffron-500 text-ink-900 shadow-lg shadow-black/25 hover:bg-saffron-400 sm:w-auto">
                      {tx.shopNow} →
                    </Button>
                  </Link>
                  <form onSubmit={onSearch} className="flex flex-1 overflow-hidden rounded-xl border border-white/25 bg-white/10 backdrop-blur transition-colors focus-within:border-white/60">
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={tx.searchPlaceholder}
                      className="w-full bg-transparent px-4 py-3 text-white placeholder:text-white/60 focus:outline-none"
                    />
                    <button type="submit" className="shrink-0 px-4 text-sm font-semibold text-white/90 hover:text-white">
                      {tx.searchBtn}
                    </button>
                  </form>
                </div>
              </Reveal>

              {/* Category quick links */}
              <Reveal delay={320}>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  {tx.cats.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/products?category=${c.slug}`}
                      className="rounded-full border border-white/20 bg-white/5 px-3.5 py-1.5 text-sm text-white/85 transition-colors hover:bg-white/15 hover:text-white"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* Floating market photo with a subtle 3D tilt on hover */}
            <div className="lg:col-span-6">
              {heroImgOk && (
                <div className="animate-float group [perspective:1200px]">
                  <div
                    onClick={() => setLightbox(true)}
                    className="relative cursor-zoom-in overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 ring-white/20 transition-transform duration-500 ease-out will-change-transform group-hover:[transform:rotateX(4deg)_rotateY(-6deg)_scale(1.03)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={HERO_PHOTO}
                      alt=""
                      onError={() => setHeroImgOk(false)}
                      className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
                    />
                    {/* Afghan flag accent along the photo base */}
                    <div dir="ltr" className="absolute bottom-0 left-0 flex h-1.5 w-full" aria-hidden="true">
                      <span className="flex-1 bg-ink-900" />
                      <span className="flex-1 bg-red-700" />
                      <span className="flex-1 bg-brand-700" />
                    </div>
                  </div>
                </div>
              )}
            </div>
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
          <Reveal className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {tx.cats.map((c) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className="hover-lift group flex flex-col items-center gap-3 rounded-xl border border-ink-100 bg-paper p-6 text-center hover:border-brand-300 hover:bg-brand-50/60"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink-700 ring-1 ring-ink-900/10 transition-colors group-hover:text-brand-700">
                  <CategoryIcon slug={c.slug} className="h-6 w-6" />
                </span>
                <span className="font-medium text-ink-800">{c.name}</span>
              </Link>
            ))}
          </Reveal>
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

      {lightbox && <Lightbox src={HERO_PHOTO} alt="" onClose={() => setLightbox(false)} />}
    </div>
  );
}
