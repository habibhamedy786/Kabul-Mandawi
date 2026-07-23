import { Lang } from "@/lib/i18n/translations";

/**
 * Fallback AFN per 1 USD, used only until the live market rate loads (see
 * CurrencyContext, which fetches a fresh rate daily). Override the starting
 * value with NEXT_PUBLIC_AFN_PER_USD. Customers are always charged in USD;
 * the AFN figure is an approximate convenience for shoppers.
 */
export const AFN_PER_USD = Number(process.env.NEXT_PUBLIC_AFN_PER_USD ?? 70);

/** "$18.00" */
export function formatUsd(usd: number): string {
  return `$${usd.toFixed(2)}`;
}

/** "؋1,159" — Persian digits when the site is in Dari or Pashto.
 *  Pass the live rate from useCurrency(); falls back to AFN_PER_USD. */
export function formatAfn(usd: number, lang: Lang, rate: number = AFN_PER_USD): string {
  const afn = Math.round(usd * rate);
  const digits = lang === "en" ? afn.toLocaleString("en-US") : afn.toLocaleString("fa-AF");
  return `؋${digits}`;
}
