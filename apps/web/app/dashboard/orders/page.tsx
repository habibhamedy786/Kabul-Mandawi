"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { OrderStatusBadge, WalletStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody } from "@/components/ui/Card";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatAfn, formatUsd } from "@/lib/currency";
import t from "@/lib/i18n/translations";

export default function MyOrdersPage() {
  const { lang } = useLang();
  const { afnPerUsd } = useCurrency();
  const tx = t[lang].dashboard;
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders.mine().then((o) => setOrders(o as Order[])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">{tx.ordersLoading}</div>;
  if (orders.length === 0) return <div className="text-ink-400">{tx.noOrdersYet}</div>;

  return (
    <div className="space-y-4">
      {orders.map((o) => (
        <Card key={o.id}>
          <CardBody>
            <button className="flex w-full items-center justify-between text-left" onClick={() => setExpanded(expanded === o.id ? null : o.id)}>
              <div>
                <p className="font-semibold text-ink-900">{o.orderNumber}</p>
                <p className="text-xs text-ink-400">{new Date(o.createdAt).toLocaleString()} · {o.city}</p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={o.status} />
                <WalletStatusBadge status={o.walletStatus} />
                <div className="text-right">
                  <span className="block font-semibold text-ink-900">{formatAfn(Number(o.totalUsd), lang, afnPerUsd)}</span>
                  <span className="block text-xs text-ink-400">≈ {formatUsd(Number(o.totalUsd))}</span>
                </div>
              </div>
            </button>

            {expanded === o.id && (
              <div className="mt-4 space-y-4 border-t border-ink-100 pt-4">
                <div>
                  <p className="text-sm font-medium text-ink-700">{tx.items}</p>
                  <ul className="mt-1 space-y-1 text-sm text-ink-600">
                    {o.items.map((i) => (
                      <li key={i.id} className="flex justify-between">
                        <span>{i.nameSnapshot} × {i.quantity}</span>
                        <span>{formatAfn(Number(i.lineTotalUsd), lang, afnPerUsd)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium text-ink-700">{tx.deliveringTo}</p>
                  <p className="text-sm text-ink-600">{o.receiverName} · {o.receiverPhone} · {o.deliveryAddress}</p>
                </div>

                {o.deliveryProof && (
                  <div>
                    <p className="text-sm font-medium text-ink-700">{tx.deliveryProof}</p>
                    <p className="text-xs text-ink-400">
                      {tx.deliveredTo} {o.deliveryProof.receiverName} {tx.on} {new Date(o.deliveryProof.deliveredAt).toLocaleString()}
                    </p>
                    <div className="mt-2 flex gap-2">
                      {o.deliveryProof.photoUrls.map((url) => (
                        <Image key={url} src={url} alt="Delivery proof" width={96} height={96} className="rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
