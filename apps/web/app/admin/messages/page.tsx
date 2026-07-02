"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface ContactRow {
  id: string;
  name: string;
  email: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.admin.contact.list()
      .then((d) => setMessages(d as ContactRow[]))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function toggleRead(m: ContactRow) {
    await api.admin.contact.markRead(m.id, !m.isRead);
    load();
  }

  const unread = messages.filter((m) => !m.isRead).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Customer Messages</h2>
        <p className="text-sm text-ink-500">{unread} unread · submitted through the Contact page.</p>
      </div>

      {loading && <p className="text-ink-400">Loading messages…</p>}
      {!loading && messages.length === 0 && <p className="text-ink-400">No messages yet.</p>}

      {messages.map((m) => (
        <Card key={m.id} className={m.isRead ? "opacity-70" : ""}>
          <CardBody className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-ink-900">
                  {m.name}
                  {!m.isRead && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
                </p>
                <p className="text-xs text-ink-400">
                  <a href={`mailto:${m.email}`} className="text-brand-700 underline">{m.email}</a> · {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => toggleRead(m)}>
                {m.isRead ? "Mark unread" : "Mark read"}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm text-ink-700">{m.message}</p>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
