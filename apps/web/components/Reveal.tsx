"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * Fades + rises its children into view as they scroll onto the screen.
 * Wrap a section's content in <Reveal>. Uses a scroll-position check (reliable
 * across all browsers) and reveals anything already in view on load. Respects
 * the user's "reduce motion" setting.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    let done = false;
    const check = () => {
      if (done) return;
      const r = el.getBoundingClientRect();
      // Reveal once the element's top rises above 92% of the viewport height.
      if (r.top < window.innerHeight * 0.92 && r.bottom > 0) {
        done = true;
        setShown(true);
        window.removeEventListener("scroll", check);
        window.removeEventListener("resize", check);
      }
    };

    check(); // reveal immediately if already visible on load
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    // Safety net: never leave content hidden if a scroll event is missed.
    const fallback = window.setTimeout(() => setShown(true), 2500);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      window.clearTimeout(fallback);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
