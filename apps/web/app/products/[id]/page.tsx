"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import t from "@/lib/i18n/translations";
import { localizeProduct, localizeCategoryName } from "@/lib/i18n/catalog";
import { formatUsd, formatAfn } from "@/lib/currency";

/* Small stroke icons for the delivery highlights (truck, shield, camera). */
function HighlightIcon({ index, className }: { index: number; className?: string }) {
  const icons: React.ReactNode[] = [
    <><path d="M2.75 6.25h11v10.5h-11zM13.75 9.25h3.9c.5 0 .96.24 1.24.65l2.1 3.03c.17.25.26.55.26.85v3h-2.5" /><circle cx="7" cy="17.75" r="1.75" /><circle cx="17" cy="17.75" r="1.75" /><path d="M8.75 17.75h6.5" /></>,
    <><path d="M12 3l7.5 3v5.1c0 4.5-3 8.4-7.5 9.9-4.5-1.5-7.5-5.4-7.5-9.9V6L12 3z" /><path d="M9.25 12.25l2 2 3.5-4.25" /></>,
    <><path d="M3.25 8.25c0-.97.7-1.8 1.66-1.9l1.87-.18.9-1.62c.3-.55.87-.9 1.5-.93a41 41 0 015.64 0c.63.03 1.2.38 1.5.93l.9 1.62 1.87.18c.96.1 1.66.93 1.66 1.9v9.5a2 2 0 01-2 2H5.25a2 2 0 01-2-2v-9.5z" /><circle cx="12" cy="13" r="3.25" /></>,
  ];
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {icons[index % icons.length]}
    </svg>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { lang } = useLang();
  const { afnPerUsd } = useCurrency();
  const tx = t[lang].products;
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setLoading(true);
    setActiveImg(0);
    api.products.get(id).then((p) => setProduct(p as Product)).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { setShareUrl(window.location.href); }, [id]);

  // Fetch a few more products from the same category once the product loads.
  useEffect(() => {
    if (!product?.category?.slug) return;
    api.products.list(`?category=${product.category.slug}&pageSize=8`)
      .then((res) => setRelated((res as { products: Product[] }).products.filter((p) => p.id !== product.id).slice(0, 4)))
      .catch(() => setRelated([]));
  }, [product?.category?.slug, product?.id]);

  if (loading) return <div className="px-4 py-16 text-center text-ink-400">{tx.detailLoading}</div>;
  if (!product) return <div className="px-4 py-16 text-center text-ink-400">{tx.notFound}</div>;

  const images = product.images?.length ? product.images : [];
  const mainImage = images[activeImg];
  const loc = localizeProduct(product, lang);
  const catName = localizeCategoryName(product.category, lang);
  const outOfStock = product.stockQty <= 0;
  const price = Number(product.priceUsd);

  const shareText = encodeURIComponent(`${loc.name} — Kabul Mandawi`);
  const encodedUrl = encodeURIComponent(shareUrl);
  const shareLinks = [
    { label: "WhatsApp", href: `https://wa.me/?text=${shareText}%20${encodedUrl}`, path: "M12 3a9 9 0 00-7.7 13.6L3 21l4.5-1.2A9 9 0 1012 3z" },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${shareText}`, path: "M21.5 4.5L2.5 11.8l5.4 1.7 2 6 2.8-3 4.2 3.1z" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, path: "M13.5 21v-7h2.3l.5-2.8h-2.8V9.3c0-.8.3-1.4 1.5-1.4h1.4V5.4c-.7-.1-1.5-.2-2.3-.2-2.3 0-3.8 1.4-3.8 3.9v2.1H8v2.8h2v7z" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-ink-400">
        <Link href="/" className="hover:text-brand-700" aria-label="Home">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M3.5 11L12 4l8.5 7M5.5 9.5V19h13V9.5" /></svg>
        </Link>
        <span>/</span>
        <Link href={`/products?category=${product.category.slug}`} className="hover:text-brand-700">{catName}</Link>
        <span>/</span>
        <span className="text-ink-600">{loc.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-ink-100 bg-ink-50">
            {mainImage ? (
              <Image src={mainImage} alt={loc.name} width={700} height={700} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink-300">{catName}</div>
            )}
            {outOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <span className="rounded-full bg-ink-900/80 px-4 py-1.5 text-sm font-semibold text-white">{tx.outOfStock}</span>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {images.map((img, i) => (
                <button
                  key={img}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${i === activeImg ? "border-brand-600" : "border-ink-100"}`}
                >
                  <Image src={img} alt={`${loc.name} ${i + 1}`} width={80} height={80} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-brand-600">{catName}</span>
          <h1 className="font-display mt-2 text-3xl font-semibold text-ink-900">{loc.name}</h1>
          {loc.unit && <p className="mt-1 text-sm text-ink-400">{loc.unit}</p>}

          {/* Stock badge */}
          <div className="mt-3">
            {outOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-xs font-semibold text-ink-500">{tx.outOfStock}</span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" /> {tx.inStock}
              </span>
            )}
          </div>

          {/* Price */}
          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-ink-900">{formatAfn(price, lang, afnPerUsd)}</span>
            <span className="text-base font-medium text-ink-400">≈ {formatUsd(price)}</span>
          </p>

          {/* Quantity + add to cart */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink-200">
              <button className="px-3.5 py-2.5 text-ink-600 hover:text-ink-900" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span className="w-10 text-center font-medium">{quantity}</span>
              <button className="px-3.5 py-2.5 text-ink-600 hover:text-ink-900" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
            <Button size="lg" disabled={outOfStock} onClick={() => {
              addToCart(product, quantity);
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }}>
              {outOfStock ? tx.outOfStock : added ? tx.added : tx.addToCart}
            </Button>
            {added && (
              <Button variant="outline" size="lg" onClick={() => router.push("/cart")}>{tx.viewCart}</Button>
            )}
          </div>

          {/* Delivery highlights */}
          <ul className="mt-7 space-y-3 rounded-2xl border border-ink-100 p-5">
            {tx.highlights.map((h, i) => (
              <li key={h} className="flex items-start gap-3">
                <HighlightIcon index={i} className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
                <span className="text-sm leading-relaxed text-ink-600">{h}</span>
              </li>
            ))}
          </ul>

          {/* Share */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-sm font-medium text-ink-500">{tx.share}:</span>
            <div className="flex gap-2">
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-ink-200 text-ink-600 transition-colors hover:border-brand-400 hover:text-brand-700"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d={s.path} /></svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {loc.description && (
        <section className="mt-12 border-t border-ink-100 pt-8">
          <h2 className="font-display text-xl font-semibold text-ink-900">{tx.descriptionHeading}</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-600">{loc.description}</p>
        </section>
      )}

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-ink-900">{tx.relatedHeading}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
