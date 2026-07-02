"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";
import { localizeProduct, localizeCategoryName } from "@/lib/i18n/catalog";
import { formatUsd, formatAfn } from "@/lib/currency";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { lang } = useLang();
  const tx = t[lang].products;
  const image = product.images?.[0];
  const loc = localizeProduct(product, lang);
  const catName = localizeCategoryName(product.category, lang);

  const price = Number(product.priceUsd);
  const compareAt = product.compareAtUsd ? Number(product.compareAtUsd) : null;
  const onSale = compareAt !== null && compareAt > price;
  const outOfStock = product.stockQty <= 0;

  return (
    <div className="hover-lift group flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-sm">
      <Link href={`/products/${product.id}`} className="relative block aspect-square overflow-hidden bg-ink-50">
        {image ? (
          <Image src={image} alt={loc.name} width={400} height={400} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-300">
            <span className="text-sm">{catName}</span>
          </div>
        )}

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">{tx.sale}</span>}
          {product.isFeatured && !onSale && <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow">★</span>}
        </div>

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-ink-900/80 px-3 py-1 text-xs font-semibold text-white">{tx.outOfStock}</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-600">{catName}</span>
        <Link href={`/products/${product.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
          {loc.name}
        </Link>
        {loc.unit && <span className="text-xs text-ink-400">{loc.unit}</span>}
        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-ink-900">{formatUsd(price)}</span>
              {onSale && <span className="text-xs text-ink-400 line-through">{formatUsd(compareAt!)}</span>}
            </div>
            <span className="text-xs font-medium text-ink-400">≈ {formatAfn(price, lang)}</span>
          </div>
          <Button size="sm" disabled={outOfStock} onClick={() => addToCart(product)}>
            {outOfStock ? tx.outOfStock : tx.addToCart}
          </Button>
        </div>
      </div>
    </div>
  );
}
