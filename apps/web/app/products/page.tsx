"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";
import { localizeCategoryName } from "@/lib/i18n/catalog";

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang } = useLang();
  const tx = t[lang].products;
  const categorySlug = searchParams.get("category") ?? "";
  const urlSearch = searchParams.get("search") ?? "";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Searches submitted from the navbar or homepage arrive as ?search= in the URL.
  useEffect(() => {
    setSearch(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);
  const [sort, setSort] = useState("featured");
  const [loading, setLoading] = useState(true);

  // Wait until the user pauses typing before hitting the API.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const sorted = [...products].sort((a, b) => {
    if (sort === "priceLow") return Number(a.priceUsd) - Number(b.priceUsd);
    if (sort === "priceHigh") return Number(b.priceUsd) - Number(a.priceUsd);
    if (sort === "featured") return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    return 0; // "newest" keeps the API order (createdAt desc)
  });

  useEffect(() => {
    api.categories.list().then((c) => setCategories(c as Category[])).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (categorySlug) params.set("category", categorySlug);
    if (debouncedSearch) params.set("search", debouncedSearch);
    params.set("pageSize", "48");

    api.products.list(`?${params.toString()}`)
      .then((res) => setProducts((res as { products: Product[] }).products))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [categorySlug, debouncedSearch]);


  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900">{tx.title}</h1>
          <p className="text-sm text-ink-500">{tx.sub}</p>
        </div>
        <input
          type="search"
          placeholder={tx.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-ink-200 px-4 py-2.5 text-sm sm:w-72"
        />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => router.push("/products")} className={`rounded-full px-4 py-1.5 text-sm font-medium ${!categorySlug ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"}`}>
            {tx.all}
          </button>
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => router.push(`/products?category=${c.slug}`)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${categorySlug === c.slug ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"}`}
            >
              {localizeCategoryName(c, lang)}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-sm text-ink-700"
          aria-label={tx.sortBy}
        >
          <option value="featured">{tx.sortBy}: {tx.sortFeatured}</option>
          <option value="priceLow">{tx.sortPriceLow}</option>
          <option value="priceHigh">{tx.sortPriceHigh}</option>
          <option value="newest">{tx.sortNewest}</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-10 text-center text-ink-400">{tx.loading}</div>
      ) : sorted.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-ink-200 p-10 text-center text-ink-500">
          {tx.noResults}{" "}
          <a href="/custom-request" className="font-medium text-brand-700 underline">{tx.customRequestLink}</a>.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {sorted.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="mt-10 text-center text-ink-400">Loading…</div>}>
      <ProductsContent />
    </Suspense>
  );
}
