"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AFN_PER_USD } from "@/lib/currency";

interface CurrencyContextValue {
  /** Live AFN per 1 USD. Starts at the fallback, then updates from the market. */
  afnPerUsd: number;
}

const CurrencyContext = createContext<CurrencyContextValue>({ afnPerUsd: AFN_PER_USD });

// Free, no-key exchange-rate feed that refreshes daily and includes AFN.
const RATE_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "afc_afn_rate";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // refresh at most twice a day

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [afnPerUsd, setAfnPerUsd] = useState<number>(AFN_PER_USD);

  useEffect(() => {
    // Use a recently-cached rate if we have one, so we don't hit the API on
    // every page load.
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { rate, ts } = JSON.parse(cached);
        if (typeof rate === "number" && rate > 0 && Date.now() - ts < CACHE_TTL_MS) {
          setAfnPerUsd(rate);
          return;
        }
      }
    } catch {
      /* ignore malformed cache and fetch fresh */
    }

    fetch(RATE_URL)
      .then((r) => r.json())
      .then((data) => {
        const rate = data?.rates?.AFN;
        if (typeof rate === "number" && rate > 0) {
          setAfnPerUsd(rate);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ rate, ts: Date.now() }));
        }
      })
      .catch(() => {
        /* keep the fallback rate if the network call fails */
      });
  }, []);

  return <CurrencyContext.Provider value={{ afnPerUsd }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
