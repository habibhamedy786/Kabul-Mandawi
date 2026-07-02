"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Category } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function load() {
    api.admin.categories.list().then((c) => setCategories(c as Category[]));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await api.admin.categories.create({ name, slug, description: description || undefined });
      setShowForm(false);
      setName(""); setSlug(""); setDescription("");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not create category.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(id: string) {
    await api.admin.categories.deactivate(id);
    load();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">Categories</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? "Cancel" : "New category"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input label="Name" required value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Slug" required placeholder="groceries" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
              {error && <p className="sm:col-span-3 text-sm text-red-600">{error}</p>}
              <div className="sm:col-span-3">
                <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create category"}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {categories.map((c) => (
          <Card key={c.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900">{c.name}</p>
                <p className="text-xs text-ink-400">/{c.slug}</p>
              </div>
              <Button size="sm" variant="danger" onClick={() => deactivate(c.id)}>Deactivate</Button>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
