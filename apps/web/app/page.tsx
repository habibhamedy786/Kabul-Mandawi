"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { api } from "@/lib/api";
import { Product } from "@/lib/types";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

const EMOJIS = ["🌾", "🌷", "📱", "🧥", "🎁"];

// Hero background: the Afghan bazaar-at-sunset photo in apps/web/public/landmarks/.
// If the file is ever missing, the hero gracefully falls back to the dark gradient.
const HERO_PHOTO = "/landmarks/hero-bg.jpg";
const CTA_PHOTO = "https://commons.wikimedia.org/wiki/Special:FilePath/Blue%20Mosque%20%28general%20view%29%2C%20Mazar-i%20Sharif%2C%20Afghanistan.jpg?width=1280";

// Landmark gallery — order matches home.landmarks.places in the translations file.
// Drop your own photos into apps/web/public/landmarks/ and reference them as
// "/landmarks/<filename>" to add them here.
const LANDMARK_PHOTOS = [
  "https://commons.wikimedia.org/wiki/Special:FilePath/Blue%20Mosque%20%28general%20view%29%2C%20Mazar-i%20Sharif%2C%20Afghanistan.jpg?width=900",
  "https://commons.wikimedia.org/wiki/Special:FilePath/Minaret%20of%20jam%202009%20ghor.jpg?width=900",
];

export default function HomePage() {
  const { lang } = useLang();
  const tx = t[lang].home;
  const px = t[lang].products;
  const [heroImgOk, setHeroImgOk] = useState(true);
  const [featured, setFeatured] = useState<Product[]>([]);

  useEffect(() => {
    api.products.list("?featured=true&pageSize=8")
      .then((res) => setFeatured((res as { products: Product[] }).products))
      .catch(() => setFeatured([]));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink-900">
        {/* National photo backdrop with a slow zoom; falls back to the gradient if it can't load */}
        {HERO_PHOTO && heroImgOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={HERO_PHOTO}
            alt=""
            aria-hidden="true"
            onError={() => setHeroImgOk(false)}
            className="absolute inset-0 h-full w-full object-cover opacity-60 animate-slow-zoom"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-ink-900/85 via-ink-900/60 to-ink-900/30" />
        {/* Afghan flag accent stripe */}
        <div className="absolute bottom-0 left-0 h-1.5 w-full bg-gradient-to-r from-black via-red-700 to-green-700" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex animate-fade-in-up items-center rounded-full bg-brand-600/20 px-3 py-1 text-xs font-semibold text-brand-300 ring-1 ring-brand-400/30">
              {tx.badge}
            </span>
            <h1 className="mt-5 animate-fade-in-up text-4xl font-extrabold tracking-tight text-white stagger-1 sm:text-5xl lg:text-6xl">
              {tx.headline}
            </h1>
            <p className="mt-5 max-w-xl animate-fade-in-up text-lg text-ink-200 stagger-2">{tx.sub}</p>
            <div className="mt-8 flex animate-fade-in-up flex-wrap gap-3 stagger-3">
              <Link href="/products"><Button size="lg" className="shadow-lg shadow-brand-900/30">{tx.shopNow}</Button></Link>
              <Link href="/custom-request">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  {tx.customRequest}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {tx.features.map((f, i) => (
            <div key={f.title} className={`hover-lift animate-fade-in-up rounded-2xl border border-ink-100 p-5 stagger-${(i % 5) + 1}`}>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-ink-900">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-4 pt-16 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ink-900">{px.featuredHeading}</h2>
              <p className="mt-1 text-ink-500">{px.featuredSub}</p>
            </div>
            <Link href="/products" className="hidden text-sm font-medium text-brand-700 hover:text-brand-800 sm:block">
              {px.viewAll} →
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* Categories */}
      <section className="bg-ink-50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-ink-900">{tx.categories.heading}</h2>
          <p className="mt-1 text-ink-500">{tx.categories.sub}</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {tx.cats.map((c, i) => (
              <Link
                key={c.slug}
                href={`/products?category=${c.slug}`}
                className={`hover-lift animate-fade-in-up flex flex-col items-center gap-3 rounded-2xl border border-ink-100 bg-white p-6 text-center stagger-${(i % 5) + 1}`}
              >
                <span className="text-3xl">{EMOJIS[i]}</span>
                <span className="font-medium text-ink-800">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* National landmarks */}
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-16 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-ink-900">{tx.landmarks.heading}</h2>
        <p className="mt-1 text-ink-500">{tx.landmarks.sub}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-5">
          {tx.landmarks.places.map((place, i) => (
            <div key={place} className={`hover-lift animate-fade-in-up group relative aspect-[4/3] w-full max-w-md overflow-hidden rounded-2xl bg-ink-100 sm:w-[calc(50%-0.625rem)] stagger-${(i % 5) + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LANDMARK_PHOTOS[i]}
                alt={place}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/85 via-ink-900/15 to-transparent" />
              <span className="absolute inset-x-2 bottom-2 text-sm font-semibold leading-tight text-white drop-shadow">{place}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-brand-600 px-6 py-14 text-center sm:px-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={CTA_PHOTO}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-700/80 to-brand-600/80" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">{tx.cta.heading}</h2>
            <p className="mx-auto mt-3 max-w-xl text-brand-50">{tx.cta.sub}</p>
            <div className="mt-6">
              <Link href="/custom-request">
                <Button size="lg" variant="secondary" className="shadow-lg">{tx.cta.btn}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
