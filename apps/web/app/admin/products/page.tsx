"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Product, Category } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">Products ({products.length})</h2>
        <Button size="sm" onClick={showForm ? () => setShowForm(false) : startNew}>{showForm ? "Cancel" : "New product"}</Button>
      </div>

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
              <Input label="Price (USD)" type="number" step="0.01" required value={form.priceUsd} onChange={(e) => setForm({ ...form, priceUsd: e.target.value })} />
              <Input label="Stock quantity" type="number" required value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              <div className="sm:col-span-2">
                <Input label="Sale — original price (USD)" type="number" step="0.01" value={form.compareAtUsd} onChange={(e) => setForm({ ...form, compareAtUsd: e.target.value })} placeholder="optional" />
                <p className="mt-1 text-xs text-ink-500">To put this product on sale, set the price to the sale price and put the higher original price here — the shop shows a “Sale” badge with the old price crossed out. Leave blank for no sale.</p>
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {products.map((p) => (
          <Card key={p.id}>
            <CardBody className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{p.name}</p>
                <p className="text-xs text-ink-400">{p.sku} · {p.category.name} · ${Number(p.priceUsd).toFixed(2)} · stock {p.stockQty}</p>
              </div>
              <div className="flex gap-2">
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
