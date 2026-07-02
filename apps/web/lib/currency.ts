import { Lang } from "@/lib/i18n/translations";

/**
 * AFN per 1 USD, used for the approximate Afghani price shown next to every
 * USD price. Override with NEXT_PUBLIC_AFN_PER_USD when the market rate moves.
 * Customers are always charged in USD; the AFN figure is informational.
 */
export const AFN_PER_USD = Number(process.env.NEXT_PUBLIC_AFN_PER_USD ?? 64.4);

/** "$18.00" */
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** "؋1,159" — Persian digits when the site is in Dari or Pashto. */
export function formatAfn(usd: number, lang: Lang): string {
  const afn = Math.round(usd * AFN_PER_USD);
  const digits = lang === "en" ? afn.toLocaleString("en-US") : afn.toLocaleString("fa-AF");
  return `؋${digits}`;
}
