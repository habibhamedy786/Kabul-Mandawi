"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import t from "@/lib/i18n/translations";
import { localizeProduct } from "@/lib/i18n/catalog";
import { formatUsd, formatAfn } from "@/lib/currency";

export default function CartPage() {
  const { lines, removeFromCart, updateQuantity, subtotal } = useCart();
  const router = useRouter();
  const { lang } = useLang();
  const tx = t[lang].cart;
  const deliveryFee = lines.length > 0 ? 5 : 0;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink-900">{tx.empty}</h1>
        <p className="mt-2 text-ink-500">{tx.emptySub}</p>
        <Link href="/products" className="mt-6 inline-block"><Button size="lg">{tx.shop}</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink-900">{tx.title}</h1>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {lines.map(({ product, quantity }) => (
            <div key={product.id} className="rounded-2xl border border-ink-100 p-4">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-ink-50 sm:h-20 sm:w-20">
                  {product.images?.[0] && (
                    <Image src={product.images[0]} alt={localizeProduct(product, lang).name} width={80} height={80} className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{localizeProduct(product, lang).name}</p>
                  <p className="text-sm text-ink-400">${Number(product.priceUsd).toFixed(2)} {tx.each}</p>
                </div>
                <button className="flex-shrink-0 text-sm text-red-600" onClick={() => removeFromCart(product.id)}>{tx.remove}</button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center rounded-xl border border-ink-200">
                  <button className="px-3 py-1.5" onClick={() => updateQuantity(product.id, Math.max(1, quantity - 1))}>−</button>
                  <span className="w-8 text-center">{quantity}</span>
                  <button className="px-3 py-1.5" onClick={() => updateQuantity(product.id, quantity + 1)}>+</button>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-ink-900">{formatUsd(Number(product.priceUsd) * quantity)}</p>
                  <p className="text-xs text-ink-400">≈ {formatAfn(Number(product.priceUsd) * quantity, lang)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-900">{tx.summary}</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between text-ink-600"><span>{tx.subtotal}</span><span>{formatUsd(subtotal)}</span></div>
            <div className="flex justify-between text-ink-600"><span>{tx.delivery}</span><span>{formatUsd(deliveryFee)}</span></div>
            <div className="flex justify-between border-t border-ink-100 pt-2 font-bold text-ink-900">
              <span>{tx.total}</span>
              <span className="text-right">
                {formatUsd(subtotal + deliveryFee)}
                <span className="block text-xs font-medium text-ink-400">≈ {formatAfn(subtotal + deliveryFee, lang)}</span>
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-ink-400">{t[lang].products.priceNote}</p>
          <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/checkout")}>{tx.checkout}</Button>
        </div>
      </div>
    </div>
  );
}
