"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StripePaymentForm } from "@/components/StripePaymentForm";
import { DeliveryCity, SavedAddress } from "@/lib/types";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import t from "@/lib/i18n/translations";
import { localizeProduct } from "@/lib/i18n/catalog";
import { formatUsd, formatAfn } from "@/lib/currency";

const CITIES: { value: DeliveryCity; label: string; available: boolean }[] = [
  { value: "KABUL", label: "Kabul", available: true },
  { value: "HERAT", label: "Herat", available: false },
  { value: "MAZAR_I_SHARIF", label: "Mazar-i-Sharif", available: false },
  { value: "KANDAHAR", label: "Kandahar", available: false },
  { value: "JALALABAD", label: "Jalalabad", available: false },
];

export default function CheckoutPage() {
  const { lines, subtotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { lang } = useLang();
  const { afnPerUsd } = useCurrency();
  const tx = t[lang].checkout;
  const router = useRouter();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [city, setCity] = useState<DeliveryCity>("KABUL");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNote, setDeliveryNote] = useState("");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<"ONLINE" | "COD">("ONLINE");
  const [deliveryType, setDeliveryType] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [codPlaced, setCodPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deliveryFee = deliveryType === "EXPRESS" ? 5 : 0; // standard delivery in Kabul is free

  useEffect(() => {
    if (!authLoading && !user) router.push("/login?redirect=/checkout");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) api.users.addresses().then((a) => setAddresses(a as SavedAddress[])).catch(() => {});
  }, [user]);

  function applySavedAddress(id: string) {
    const addr = addresses.find((a) => a.id === id);
    if (addr) {
      setReceiverName(addr.receiverName);
      setReceiverPhone(addr.phone);
      setCity(addr.city);
      setDeliveryAddress(addr.addressLine);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await api.orders.create({
        items: lines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
        receiverName, receiverPhone, city, deliveryAddress, deliveryNote,
        paymentMethod: payMethod, deliveryType,
      }) as { order: { orderNumber: string }; clientSecret?: string; cod?: boolean };
      setOrderNumber(res.order.orderNumber);
      if (res.cod) {
        clearCart();
        setCodPlaced(true);
      } else {
        setClientSecret(res.clientSecret ?? null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
    } finally {
      setSubmitting(false);
    }
  }

  if (codPlaced) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="text-2xl font-bold text-ink-900">{tx.codPlacedHeading}</h1>
        <p className="mt-2 text-ink-500">{orderNumber}</p>
        <p className="mt-3 text-ink-600">{tx.codPlacedSub}</p>
        <Button className="mt-6" size="lg" onClick={() => router.push("/dashboard/orders")}>{tx.viewOrders}</Button>
      </div>
    );
  }

  if (lines.length === 0 && !clientSecret) {
    return <div className="px-4 py-20 text-center text-ink-500">{tx.emptyCart} <a href="/products" className="text-brand-700 underline">{tx.browse}</a>.</div>;
  }

  if (clientSecret) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-ink-900">{tx.payFor} {orderNumber}</h1>
        <p className="mt-1 text-sm text-ink-500">{tx.payNote}</p>
        <div className="mt-6 rounded-2xl border border-ink-100 p-6">
          <StripePaymentForm
            clientSecret={clientSecret}
            onSuccess={() => { clearCart(); router.push("/dashboard/orders"); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-ink-900">{tx.title}</h1>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl border border-ink-100 p-6">
            <h2 className="font-semibold text-ink-900">{tx.receiverHeading}</h2>
            <p className="mt-1 text-sm text-ink-500">{tx.receiverSub}</p>

            {addresses.length > 0 && (
              <Select label={tx.savedAddress} defaultValue="" onChange={(e) => applySavedAddress(e.target.value)} className="mt-4">
                <option value="">{tx.selectSaved}</option>
                {addresses.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.receiverName})</option>)}
              </Select>
            )}

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={tx.receiverName} required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
              <Input label={tx.phone} required value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} />
              <Select label={tx.city} value={city} onChange={(e) => setCity(e.target.value as DeliveryCity)}>
                {CITIES.map((c) => <option key={c.value} value={c.value} disabled={!c.available}>{c.label}{c.available ? "" : ` (${tx.comingSoon})`}</option>)}
              </Select>
              <div />
              <div className="sm:col-span-2">
                <Input label={tx.address} required value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Textarea label={tx.note} value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} rows={3} />
              </div>
            </div>
          </div>

          {/* Delivery method */}
          <div className="rounded-2xl border border-ink-100 p-6">
            <h2 className="font-semibold text-ink-900">{tx.deliveryMethod}</h2>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${deliveryType === "STANDARD" ? "border-brand-600 bg-brand-50" : "border-ink-200"}`}>
                <input type="radio" name="deliveryType" className="mt-1 accent-brand-600" checked={deliveryType === "STANDARD"} onChange={() => setDeliveryType("STANDARD")} />
                <span className="flex-1">
                  <span className="flex items-center justify-between font-medium text-ink-900">
                    <span>{tx.standardDelivery}</span>
                    <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800">{tx.free}</span>
                  </span>
                  <span className="block text-sm text-ink-500">{tx.standardDesc}</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${deliveryType === "EXPRESS" ? "border-brand-600 bg-brand-50" : "border-ink-200"}`}>
                <input type="radio" name="deliveryType" className="mt-1 accent-brand-600" checked={deliveryType === "EXPRESS"} onChange={() => setDeliveryType("EXPRESS")} />
                <span className="flex-1">
                  <span className="flex items-center justify-between font-medium text-ink-900">
                    <span>{tx.expressDelivery} ⚡</span>
                    <span className="text-sm font-semibold text-ink-700">+$5.00</span>
                  </span>
                  <span className="block text-sm text-ink-500">{tx.expressDesc}</span>
                </span>
              </label>
            </div>
          </div>

          {/* Payment method */}
          <div className="rounded-2xl border border-ink-100 p-6">
            <h2 className="font-semibold text-ink-900">{tx.payMethod}</h2>
            <div className="mt-4 space-y-3">
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payMethod === "ONLINE" ? "border-brand-600 bg-brand-50" : "border-ink-200"}`}>
                <input type="radio" name="payMethod" className="mt-1 accent-brand-600" checked={payMethod === "ONLINE"} onChange={() => setPayMethod("ONLINE")} />
                <span>
                  <span className="block font-medium text-ink-900">{tx.payOnline}</span>
                  <span className="block text-sm text-ink-500">{tx.payOnlineDesc}</span>
                </span>
              </label>
              <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${payMethod === "COD" ? "border-brand-600 bg-brand-50" : "border-ink-200"}`}>
                <input type="radio" name="payMethod" className="mt-1 accent-brand-600" checked={payMethod === "COD"} onChange={() => setPayMethod("COD")} />
                <span>
                  <span className="block font-medium text-ink-900">{tx.payCod} 💵</span>
                  <span className="block text-sm text-ink-500">{tx.payCodDesc}</span>
                </span>
              </label>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? tx.preparing : payMethod === "COD" ? tx.placeCodOrder : tx.continue}
          </Button>
        </form>

        <div className="rounded-2xl border border-ink-100 p-6">
          <h2 className="font-semibold text-ink-900">{tx.summary}</h2>
          <ul className="mt-4 space-y-2 text-sm text-ink-600">
            {lines.map((l) => (
              <li key={l.product.id} className="flex justify-between">
                <span>{localizeProduct(l.product, lang).name} × {l.quantity}</span>
                <span>${(Number(l.product.priceUsd) * l.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-sm">
            <div className="flex justify-between text-ink-600"><span>{tx.subtotal}</span><span>{formatUsd(subtotal)}</span></div>
            <div className="flex justify-between text-ink-600"><span>{tx.delivery}</span><span>{deliveryFee === 0 ? tx.free : formatUsd(deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-ink-900">
              <span>{tx.total}</span>
              <span className="text-right">
                {formatAfn(subtotal + deliveryFee, lang, afnPerUsd)}
                <span className="block text-xs font-medium text-ink-400">≈ {formatUsd(subtotal + deliveryFee)}</span>
              </span>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-snug text-ink-400">{t[lang].products.priceNote}</p>
        </div>
      </div>
    </div>
  );
}
