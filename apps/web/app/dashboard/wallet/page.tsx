"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Order } from "@/lib/types";
import { OrderStatusBadge, WalletStatusBadge } from "@/components/StatusBadge";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { useLang } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { formatAfn, formatUsd } from "@/lib/currency";
import t from "@/lib/i18n/translations";

interface WalletOverview {
  held: Order[];
  released: Order[];
  refunds: Order[];
  orders: Order[];
}

export default function WalletPage() {
  const { lang } = useLang();
  const { afnPerUsd } = useCurrency();
  const tx = t[lang].dashboard.wallet;
  const [data, setData] = useState<WalletOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.wallet.mine().then((d) => setData(d as WalletOverview)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-ink-400">{tx.loading}</div>;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><h2 className="font-semibold text-ink-900">{tx.howHeading}</h2></CardHeader>
        <CardBody>
          <p className="text-sm text-ink-600">{tx.howBody}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-ink-900">{tx.heldHeading} ({data.held.length})</h2></CardHeader>
        <CardBody className="space-y-2">
          {data.held.length === 0 && <p className="text-sm text-ink-400">{tx.noHeld}</p>}
          {data.held.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
              <span className="font-medium text-ink-900">{o.orderNumber}</span>
              <WalletStatusBadge status={o.walletStatus} />
              <span className="text-right font-semibold text-ink-900">{formatAfn(Number(o.totalUsd), lang, afnPerUsd)}<span className="block text-xs font-normal text-ink-400">≈ {formatUsd(Number(o.totalUsd))}</span></span>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="font-semibold text-ink-900">{tx.refundHeading} ({data.refunds.length})</h2></CardHeader>
        <CardBody className="space-y-2">
          {data.refunds.length === 0 && <p className="text-sm text-ink-400">{tx.noRefunds}</p>}
          {data.refunds.map((o) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-ink-100 p-3 text-sm">
              <span className="font-medium text-ink-900">{o.orderNumber}</span>
              <OrderStatusBadge status={o.status} />
              <span className="text-right font-semibold text-ink-900">{formatAfn(Number(o.totalUsd), lang, afnPerUsd)}<span className="block text-xs font-normal text-ink-400">≈ {formatUsd(Number(o.totalUsd))}</span></span>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
