"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { SavedAddress, DeliveryCity } from "@/lib/types";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLang } from "@/context/LanguageContext";
import t from "@/lib/i18n/translations";

export default function AddressesPage() {
  const { lang } = useLang();
  const tx = t[lang].dashboard.addresses;
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [label, setLabel] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState<DeliveryCity>("KABUL");
  const [addressLine, setAddressLine] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function load() {
    api.users.addresses().then((a) => setAddresses(a as SavedAddress[]));
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.users.addAddress({ label, receiverName, phone, city, addressLine });
      setShowForm(false);
      setLabel(""); setReceiverName(""); setPhone(""); setAddressLine("");
      load();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-900">{tx.heading}</h2>
        <Button size="sm" onClick={() => setShowForm((v) => !v)}>{showForm ? tx.cancel : tx.add}</Button>
      </div>

      {showForm && (
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input label={tx.label} placeholder={tx.labelPlaceholder} required value={label} onChange={(e) => setLabel(e.target.value)} />
              <Input label={tx.receiverName} required value={receiverName} onChange={(e) => setReceiverName(e.target.value)} />
              <Input label={tx.phone} required value={phone} onChange={(e) => setPhone(e.target.value)} />
              <Select label={tx.city} value={city} onChange={(e) => setCity(e.target.value as DeliveryCity)}>
                <option value="KABUL">Kabul</option>
              </Select>
              <div className="sm:col-span-2">
                <Input label={tx.address} required value={addressLine} onChange={(e) => setAddressLine(e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={submitting}>{submitting ? tx.saving : tx.save}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {addresses.map((a) => (
          <Card key={a.id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium text-ink-900">{a.label} {a.isDefault && <span className="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{tx.default}</span>}</p>
                <p className="text-sm text-ink-500">{a.receiverName} · {a.phone}</p>
                <p className="text-sm text-ink-500">{a.addressLine}, {a.city}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={async () => { await api.users.deleteAddress(a.id); load(); }}>{tx.remove}</Button>
            </CardBody>
          </Card>
        ))}
        {addresses.length === 0 && !showForm && <p className="text-ink-400">{tx.none}</p>}
      </div>
    </div>
  );
}
