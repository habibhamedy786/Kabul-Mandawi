"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { CartLine, Product } from "@/lib/types";

interface CartContextValue {
  lines: CartLine[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "afc_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  // Guards the save effect: without it, the initial empty render overwrites
  // the stored cart before the load effect has restored it (worse under
  // React StrictMode's double-mount), wiping the cart on every page load.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setLines(JSON.parse(raw));
      } catch {
        /* ignore corrupt cart */
      }
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  function addToCart(product: Product, quantity = 1) {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) => (l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { product, quantity }];
    });
  }

  function removeFromCart(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function updateQuantity(productId: string, quantity: number) {
    setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
  }

  function clearCart() {
    setLines([]);
  }

  const subtotal = lines.reduce((sum, l) => sum + Number(l.product.priceUsd) * l.quantity, 0);
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  return (
    <CartContext.Provider value={{ lines, addToCart, removeFromCart, updateQuantity, clearCart, subtotal, itemCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
