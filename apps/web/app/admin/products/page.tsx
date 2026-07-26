"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { parseCsv, categoryDisplayName, slugify } from "@/lib/csvImport";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ProductFormState {
  sku: string;
  name: string;
  description: string;
  nameFa: string;
  namePs: string;
  descriptionFa: string;
  descriptionPs: string;
  unitFa: string;
  unitPs: string;
  priceUsd: string;
  categoryId: string;
  stockQty: string;
  unit: string;
  isFeatured: boolean;
  images: string[];
  compareAtUsd: string;
}

const EMPTY_FORM: ProductFormState = {
  sku: "", name: "", description: "", nameFa: "", namePs: "", descriptionFa: "", descriptionPs: "",
  unitFa: "", unitPs: "", priceUsd: "", categoryId: "", stockQty: "0", unit: "", isFeatured: false, images: [], compareAtUsd: "",
};

export default function AdminProductsPage() {
  const { user } = useAuth();
  const { afnPerUsd } = useCurrency(); // live AFN-per-USD, for the price helper
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isAdmin = user?.role === "SUPER_ADMIN" || user?.role === "ADMIN";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [discountPct, setDiscountPct] = useState("");
  const [saleBusy, setSaleBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ created: number; failed: { sku: string; error: string }[] } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Upload one or more photos and append them to the product's image list.
  async function handleImageUpload(files: FileList) {
    setUploading(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        const { url } = await api.admin.uploadImage(file);
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  }

  // Move a photo to the front — the first photo is the product's main image.
  function makeMainImage(index: number) {
    setForm((f) => {
      const next = [...f.images];
      const [img] = next.splice(index, 1);
      next.unshift(img);
      return { ...f, images: next };
    });
  }

  function load() {
    Promise.all([
      api.admin.products.list("?pageSize=100"),
      api.admin.categories.list(),
    ]).then(([p, c]) => {
      setProducts((p as { products: Product[] }).products);
      setCategories(c as Category[]);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Bulk-import products from a CSV (SKU, names, Dari/Pashto descriptions,
  // prices, category). Missing categories are created automatically. USD is the
  // stored base price; if a row only has an AFN price, it's converted at today's rate.
  async function handleImportCsv(file: File) {
    setImporting(true); setImportResult(null); setError("");
    try {
      const rows = parseCsv(await file.text());
      if (rows.length < 2) { setError("That CSV looks empty."); return; }

      const header = rows[0].map((h) => h.trim().toLowerCase());
      const col = (name: string) => header.indexOf(name.toLowerCase());
      const idx = {
        sku: col("sku"), nameEn: col("name (english)"), nameFa: col("name (dari)"),
        category: col("category"), descEn: col("description (english)"),
        descFa: col("description (dari)"), descPs: col("description (pashto)"),
        priceUsd: col("price usd"), priceAfn: col("price afn"),
        image: col("image"), stock: col("stock"), unit: col("unit"),
      };
      if (idx.sku < 0 || idx.nameEn < 0) {
        setError('CSV must have at least "SKU" and "Name (English)" columns.'); return;
      }

      // Category name (lowercased) → id, seeded from existing categories.
      const catMap = new Map<string, string>();
      categories.forEach((c) => catMap.set(c.name.trim().toLowerCase(), c.id));
      async function resolveCategory(raw: string): Promise<string> {
        const display = categoryDisplayName(raw) || "Uncategorized";
        const key = display.toLowerCase();
        const existing = catMap.get(key);
        if (existing) return existing;
        const created = (await api.admin.categories.create({ name: display, slug: slugify(display) })) as { id: string };
        catMap.set(key, created.id);
        return created.id;
      }

      const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");
      const failed: { sku: string; error: string }[] = [];
      let created = 0;

      for (const r of rows.slice(1)) {
        const sku = get(r, idx.sku);
        const name = get(r, idx.nameEn);
        if (!sku || !name) continue;
        try {
          const usd = Number(get(r, idx.priceUsd));
          const afn = Number(get(r, idx.priceAfn));
          const priceUsd = usd > 0 ? usd : afn > 0 ? Number((afn / afnPerUsd).toFixed(2)) : 0;
          if (!(priceUsd > 0)) throw new Error("missing or invalid price");

          const img = get(r, idx.image);
          const categoryId = await resolveCategory(get(r, idx.category));

          await api.admin.products.create({
            sku, name,
            description: get(r, idx.descEn) || name, // English description is required
            nameFa: get(r, idx.nameFa) || null,
            descriptionFa: get(r, idx.descFa) || null,
            descriptionPs: get(r, idx.descPs) || null,
            priceUsd, categoryId,
            stockQty: Number(get(r, idx.stock)) || 0,
            unit: get(r, idx.unit) || undefined,
            images: /^https?:\/\//i.test(img) ? [img] : [],
          });
          created++;
        } catch (e) {
          failed.push({ sku, error: e instanceof ApiError ? e.message : e instanceof Error ? e.message : "failed" });
        }
      }

      setImportResult({ created, failed });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setImporting(false);
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      sku: p.sku, name: p.name, description: p.description, priceUsd: String(p.priceUsd),
      nameFa: p.nameFa ?? "", namePs: p.namePs ?? "", descriptionFa: p.descriptionFa ?? "", descriptionPs: p.descriptionPs ?? "",
      unitFa: p.unitFa ?? "", unitPs: p.unitPs ?? "",
      categoryId: p.category.id, stockQty: String(p.stockQty), unit: p.unit ?? "",
      isFeatured: p.isFeatured, images: p.images ?? [],
      compareAtUsd: p.compareAtUsd ? String(p.compareAtUsd) : "",
    });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    const body = {
      sku: form.sku,
      name: form.name,
      description: form.description,
      nameFa: form.nameFa || null,
      namePs: form.namePs || null,
      descriptionFa: form.descriptionFa || null,
      descriptionPs: form.descriptionPs || null,
      unitFa: form.unitFa || null,
      unitPs: form.unitPs || null,
      priceUsd: Number(form.priceUsd),
      compareAtUsd: form.compareAtUsd ? Number(form.compareAtUsd) : null,
      categoryId: form.categoryId,
      stockQty: Number(form.stockQty),
      unit: form.unit || undefined,
      isFeatured: form.isFeatured,
      images: form.images,
    };
    try {
      if (editingId) {
        await api.admin.products.update(editingId, body);
      } else {
        await api.admin.products.create(body);
      }
      setShowForm(false);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    await api.admin.products.deactivate(id);
    load();
  }

  // ── Multi-select bulk actions ──────────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleSelectAll() {
    setSelected((s) => (s.length === products.length ? [] : products.map((p) => p.id)));
  }

  // Hide the selected products from the store (reversible — they can be re-activated).
  async function bulkDeactivate() {
    if (!selected.length) return;
    if (!confirm(`Hide ${selected.length} product(s) from the store? They stay in your list and can be turned back on later.`)) return;
    setBulkBusy(true);
    try {
      for (const id of selected) { try { await api.admin.products.deactivate(id); } catch { /* skip */ } }
      setSelected([]); load();
    } finally { setBulkBusy(false); }
  }

  // Permanently delete the selected products. Super Admins can force-delete items
  // that appear in past orders (those orders keep their saved name and price).
  async function bulkDelete() {
    if (!selected.length) return;
    if (!confirm(`Permanently delete ${selected.length} product(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    let failed = 0;
    try {
      for (const id of selected) {
        try {
          await api.admin.products.remove(id);
        } catch (e) {
          if (e instanceof ApiError && e.status === 409 && isSuperAdmin) {
            try { await api.admin.products.remove(id, true); } catch { failed++; }
          } else { failed++; }
        }
      }
      setSelected([]); load();
      if (failed) alert(`${failed} product(s) could not be deleted (they may be in past orders).`);
    } finally { setBulkBusy(false); }
  }

  async function remove(p: Product) {
    if (!confirm(`Permanently delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await api.admin.products.remove(p.id);
      load();
    } catch (e) {
      // Blocked because it's in past orders — a Super Admin can force it.
      if (e instanceof ApiError && e.status === 409 && isSuperAdmin) {
        if (confirm(`"${p.name}" is in past orders. Delete it anyway? Those orders will still show the item's name and price.`)) {
          try { await api.admin.products.remove(p.id, true); load(); }
          catch (e2) { alert(e2 instanceof ApiError ? e2.message : "Could not delete product."); }
        }
        return;
      }
      alert(e instanceof ApiError ? e.message : "Could not delete product.");
    }
  }

  async function applyStoreSale() {
    const pct = Number(discountPct);
    if (!pct || pct < 1 || pct > 90) { alert("Enter a discount between 1 and 90."); return; }
    if (!confirm(`Put ALL products on sale at ${pct}% off? (Products already on sale are left as they are.)`)) return;
    setSaleBusy(true);
    try {
      await api.admin.products.discountAll(pct);
      setDiscountPct("");
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Could not apply the sale.");
    } finally { setSaleBusy(false); }
  }

  async function clearStoreSale() {
    if (!confirm("End ALL sales and restore every product's original price?")) return;
    setSaleBusy(true);
    try {
      await api.admin.products.clearDiscounts();
      load();
    } catch (e) {
      alert(e instanceof ApiError ? e.message : "Could not clear the sales.");
    } finally { setSaleBusy(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-ink-900">Products ({products.length})</h2>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <label className={`inline-flex cursor-pointer items-center rounded-lg border border-ink-300 px-3 py-1.5 text-sm font-medium text-ink-700 hover:bg-ink-50 ${importing ? "pointer-events-none opacity-60" : ""}`}>
              {importing ? "Importing…" : "Import CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={importing}
                onChange={(e) => { if (e.target.files?.[0]) handleImportCsv(e.target.files[0]); e.target.value = ""; }}
              />
            </label>
          )}
          <Button size="sm" onClick={showForm ? () => setShowForm(false) : startNew}>{showForm ? "Cancel" : "New product"}</Button>
        </div>
      </div>

      {importResult && (
        <Card>
          <CardBody className="text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-green-700">✓ Imported {importResult.created} product(s).</p>
              <button className="text-xs text-ink-400 hover:text-ink-700" onClick={() => setImportResult(null)}>Dismiss</button>
            </div>
            {importResult.failed.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold text-red-600">{importResult.failed.length} row(s) skipped:</p>
                <ul className="mt-1 list-disc pl-5 text-ink-600">
                  {importResult.failed.map((f, i) => <li key={i}>{f.sku || "(no SKU)"} — {f.error}</li>)}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Store-wide sale — put every product on sale, or end all sales at once. */}
      {isAdmin && (
        <Card>
          <CardBody className="flex flex-wrap items-end gap-3">
            <div>
              <p className="text-sm font-semibold text-ink-900">Store-wide sale</p>
              <p className="text-xs text-ink-500">Put every product on sale at once. Products already on sale stay unchanged.</p>
            </div>
            <div className="ml-auto flex items-end gap-2">
              <Input label="% off all" type="number" min={1} max={90} value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} className="w-24" />
              <Button size="sm" disabled={saleBusy} onClick={applyStoreSale}>Apply</Button>
              <Button size="sm" variant="outline" disabled={saleBusy} onClick={clearStoreSale}>Remove all sales</Button>
            </div>
          </CardBody>
        </Card>
      )}

      {showForm && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label="SKU" required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
              <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <div className="sm:col-span-2">
                <Textarea label="Description" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="sm:col-span-2 rounded-xl bg-brand-50 p-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Price in AFN (؋) — enter this"
                    type="number" step="1" min={0}
                    value={form.priceUsd ? String(Math.round(Number(form.priceUsd) * afnPerUsd)) : ""}
                    onChange={(e) => {
                      const afn = Number(e.target.value);
                      setForm({ ...form, priceUsd: afn > 0 ? (afn / afnPerUsd).toFixed(2) : "" });
                    }}
                  />
                  <Input
                    label="Price (USD) — base price, saved"
                    type="number" step="0.01" required
                    value={form.priceUsd}
                    onChange={(e) => setForm({ ...form, priceUsd: e.target.value })}
                  />
                </div>
                <p className="mt-2 text-xs text-ink-500">
                  Today&apos;s rate: ؋{afnPerUsd.toFixed(2)} = $1. Type the price in Afghani and the USD base fills in automatically. USD is stored as the base price; the Afghani shown to shoppers updates on its own as the daily rate changes.
                </p>
              </div>
              <Input label="Stock quantity" type="number" required value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              <div className="sm:col-span-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="Sale — original price in AFN (؋)"
                    type="number" step="1" min={0}
                    value={form.compareAtUsd ? String(Math.round(Number(form.compareAtUsd) * afnPerUsd)) : ""}
                    onChange={(e) => {
                      const afn = Number(e.target.value);
                      setForm({ ...form, compareAtUsd: afn > 0 ? (afn / afnPerUsd).toFixed(2) : "" });
                    }}
                    placeholder="optional"
                  />
                  <Input
                    label="Original price (USD) — base"
                    type="number" step="0.01"
                    value={form.compareAtUsd}
                    onChange={(e) => setForm({ ...form, compareAtUsd: e.target.value })}
                    placeholder="optional"
                  />
                </div>
                <p className="mt-1 text-xs text-ink-500">To put this product on sale, set the <strong>Price</strong> above to the sale price and enter the higher original price here — the shop shows a “Sale” badge with the old price crossed out. Leave blank for no sale.</p>
              </div>
              <Select label="Category" required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
              <Input label="Unit (e.g. 25kg bag)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />

              {/* Translations — optional. Leave blank to show the English version. */}
              <div className="sm:col-span-2 mt-2 rounded-xl bg-ink-50 p-4">
                <p className="text-sm font-semibold text-ink-800">Translations (optional)</p>
                <p className="mb-3 text-xs text-ink-500">Fill these in so customers browsing in Dari or Pashto see this product in their language. Leave blank to fall back to English.</p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">دری · Dari</p>
                    <div className="space-y-3">
                      <Input label="Name (Dari)" dir="rtl" value={form.nameFa} onChange={(e) => setForm({ ...form, nameFa: e.target.value })} />
                      <Textarea label="Description (Dari)" dir="rtl" rows={2} value={form.descriptionFa} onChange={(e) => setForm({ ...form, descriptionFa: e.target.value })} />
                      <Input label="Unit (Dari)" dir="rtl" value={form.unitFa} onChange={(e) => setForm({ ...form, unitFa: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-brand-600">پښتو · Pashto</p>
                    <div className="space-y-3">
                      <Input label="Name (Pashto)" dir="rtl" value={form.namePs} onChange={(e) => setForm({ ...form, namePs: e.target.value })} />
                      <Textarea label="Description (Pashto)" dir="rtl" rows={2} value={form.descriptionPs} onChange={(e) => setForm({ ...form, descriptionPs: e.target.value })} />
                      <Input label="Unit (Pashto)" dir="rtl" value={form.unitPs} onChange={(e) => setForm({ ...form, unitPs: e.target.value })} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-medium text-ink-800">Product photos</label>
                <p className="mb-2 text-xs text-ink-500">Add up to a few photos. The first photo is the main one shown in the shop — use “Make main” to change it.</p>
                <div className="flex flex-wrap items-start gap-3">
                  {form.images.map((img, i) => (
                    <div key={img} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`photo ${i + 1}`} className="h-24 w-24 rounded-lg border border-ink-100 object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">Main</span>
                      )}
                      <button type="button" onClick={() => removeImage(i)} aria-label="Remove photo"
                        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white shadow">×</button>
                      {i !== 0 && (
                        <button type="button" onClick={() => makeMainImage(i)}
                          className="absolute inset-x-1 bottom-1 rounded bg-ink-900/75 py-0.5 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">Make main</button>
                      )}
                    </div>
                  ))}
                  <label className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-700">
                    <span className="text-lg leading-none">＋</span>
                    {uploading ? "Uploading…" : "Add photo"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic"
                      multiple
                      className="hidden"
                      disabled={uploading}
                      onChange={(e) => { if (e.target.files?.length) handleImageUpload(e.target.files); e.target.value = ""; }}
                    />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-700">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
                Featured on homepage
              </label>
              {error && <p className="sm:col-span-2 text-sm text-red-600">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : editingId ? "Save changes" : "Create product"}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {loading && <p className="text-ink-400">Loading products…</p>}

      {/* Multi-select bar — tick products to deactivate or delete them in one go. */}
      {isAdmin && products.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input type="checkbox" checked={selected.length === products.length && products.length > 0} onChange={toggleSelectAll} />
            Select all
          </label>
          <span className="text-sm text-ink-500">{selected.length} selected</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" disabled={!selected.length || bulkBusy} onClick={bulkDeactivate}>Deactivate selected</Button>
            <Button size="sm" variant="danger" disabled={!selected.length || bulkBusy} onClick={bulkDelete}>Delete selected</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 flex-shrink-0"
                  checked={selected.includes(p.id)}
                  onChange={() => toggleSelect(p.id)}
                  aria-label={`Select ${p.name}`}
                />
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink-900">{p.name}</p>
                  <p className="truncate text-xs text-ink-400">{p.sku} · {p.category.name} · ${Number(p.priceUsd).toFixed(2)} · stock {p.stockQty}</p>
                </div>
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>Edit</Button>
                <Button size="sm" variant="outline" onClick={() => deactivate(p.id)}>Deactivate</Button>
                <Button size="sm" variant="danger" onClick={() => remove(p)}>Delete</Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
