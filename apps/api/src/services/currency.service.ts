import { env } from "@/config/env";

/**
 * AFN per 1 USD for receipts and emails. Mirrors the storefront: a live daily
 * market rate with an env fallback. Customers are charged in USD; the AFN figure
 * is the amount shown to Afghan recipients on the invoice.
 */

// Same free, no-key feed the storefront uses; refreshes daily and includes AFN.
const RATE_URL = "https://open.er-api.com/v6/latest/USD";
const TTL_MS = 12 * 60 * 60 * 1000; // refresh at most twice a day

let cached: { rate: number; ts: number } | null = null;

/** Live AFN per 1 USD, cached in memory. Falls back to env.afnPerUsd on failure. */
export async function getAfnRate(): Promise<number> {
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.rate;
  try {
    const res = await fetch(RATE_URL);
    const data = (await res.json()) as { rates?: { AFN?: number } };
    const rate = data?.rates?.AFN;
    if (typeof rate === "number" && rate > 0) {
      cached = { rate, ts: Date.now() };
      return rate;
    }
  } catch {
    /* keep the fallback rate if the network call fails */
  }
  return cached?.rate ?? env.afnPerUsd;
}

/** "؋2,415" — Afghani, rounded, with a thousands separator. */
export function formatAfn(usd: number, rate: number): string {
  return `؋${Math.round(usd * rate).toLocaleString("en-US")}`;
}
