"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Product } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import t from "@/lib/i18n/translations";
import { localizeProduct, localizeCategoryName } from "@/lib/i18n/catalog";
import { formatUsd, formatAfn } from "@/lib/currency";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addToCart } = useCart();
  const { lang } = useLang();
  const { afnPerUsd } = useCurrency();
  const tx = t[lang].products;
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    api.products.get(id).then((p) => setProduct(p as Product)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="px-4 py-16 text-center text-ink-400">{tx.detailLoading}</div>;
  if (!product) return <div className="px-4 py-16 text-center text-ink-400">{tx.notFound}</div>;

  const image = product.images?.[0];
  const loc = localizeProduct(product, lang);
  const catName = localizeCategoryName(product.category, lang);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-ink-50">
          {image ? (
            <Image src={image} alt={loc.name} width={600} height={600} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-ink-300">{catName}</div>
          )}
        </div>

        <div>
          <span className="text-sm font-medium uppercase tracking-wide text-brand-600">{catName}</span>
          <h1 className="mt-2 text-3xl font-bold text-ink-900">{loc.name}</h1>
          {loc.unit && <p className="mt-1 text-sm text-ink-400">{loc.unit}</p>}
          <p className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-ink-900">{formatAfn(Number(product.priceUsd), lang, afnPerUsd)}</span>
            <span className="text-base font-medium text-ink-400">≈ {formatUsd(Number(product.priceUsd))}</span>
          </p>
          <p className="mt-4 leading-relaxed text-ink-600">{loc.description}</p>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center rounded-xl border border-ink-200">
              <button className="px-3 py-2 text-ink-600" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
              <span className="w-10 text-center">{quantity}</span>
              <button className="px-3 py-2 text-ink-600" onClick={() => setQuantity((q) => q + 1)}>+</button>
            </div>
            <Button size="lg" onClick={() => {
              addToCart(product, quantity);
              setAdded(true);
              setTimeout(() => setAdded(false), 2500);
            }}>
              {added ? tx.added : tx.addToCart}
            </Button>
            {added && (
              <Button variant="outline" size="lg" onClick={() => router.push("/cart")}>
                {tx.viewCart}
              </Button>
            )}
          </div>

          <div className="mt-8 rounded-xl bg-ink-50 p-4 text-sm text-ink-600">
            {tx.deliveryNote}
          </div>
        </div>
      </div>
    </div>
  );
}
