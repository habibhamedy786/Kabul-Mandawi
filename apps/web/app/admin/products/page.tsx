"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Product, Category } from "@/lib/types";
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
  imageUrl: string;
}

const EMPTY_FORM: ProductFormState = {
  sku: "", name: "", description: "", nameFa: "", namePs: "", descriptionFa: "", descriptionPs: "",
  unitFa: "", unitPs: "", priceUsd: "", categoryId: "", stockQty: "0", unit: "", isFeatured: false, imageUrl: "",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const { url } = await api.admin.uploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setUploading(false);
    }
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
      isFeatured: p.isFeatured, imageUrl: p.images[0] ?? "",
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
      categoryId: form.categoryId,
      stockQty: Number(form.stockQty),
      unit: form.unit || undefined,
      isFeatured: form.isFeatured,
      images: form.imageUrl ? [form.imageUrl] : [],
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
      // Most likely: the product is part of past orders, so deletion is blocked.
      alert(e instanceof ApiError ? e.message : "Could not delete product.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">Products ({products.length})</h2>
        <Button size="sm" onClick={showForm ? () => setShowForm(false) : startNew}>{showForm ? "Cancel" : "New product"}</Button>
      </div>

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
                <label className="text-sm font-medium text-ink-800">Product photo</label>
                <div className="mt-1 flex items-start gap-4">
                  {form.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imageUrl} alt="preview" className="h-20 w-20 flex-shrink-0 rounded-lg border border-ink-100 object-cover" />
                  ) : (
                    <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg border border-dashed border-ink-200 text-xs text-ink-400">No image</div>
                  )}
                  <div className="flex-1 space-y-2">
                    <label className="inline-flex cursor-pointer items-center rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                      {uploading ? "Uploading…" : "Upload photo"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic"
                        className="hidden"
                        disabled={uploading}
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); e.target.value = ""; }}
                      />
                    </label>
                    <Input label="…or paste an image URL" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
                  </div>
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
