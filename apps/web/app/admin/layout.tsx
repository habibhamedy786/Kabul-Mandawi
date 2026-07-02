"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Role } from "@/lib/types";

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
}

const ANY_ADMIN: Role[] = ["SUPER_ADMIN", "ADMIN"];

const LINKS: NavLink[] = [
  { href: "/admin", label: "Overview", roles: ANY_ADMIN },
  { href: "/admin/orders", label: "Orders", roles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_OFFICER", "CUSTOMER_SUPPORT"] },
  { href: "/admin/deliveries", label: "My Deliveries", roles: ["DELIVERY_STAFF"] },
  { href: "/admin/products", label: "Products", roles: ANY_ADMIN },
  { href: "/admin/categories", label: "Categories", roles: ANY_ADMIN },
  { href: "/admin/custom-requests", label: "Custom Requests", roles: ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"] },
  { href: "/admin/refunds", label: "Refunds", roles: ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"] },
  { href: "/admin/messages", label: "Messages", roles: ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT"] },
  { href: "/admin/customers", label: "Customers", roles: ANY_ADMIN },
  { href: "/admin/staff", label: "Staff", roles: ["SUPER_ADMIN"] },
  { href: "/admin/account", label: "My Account", roles: ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_OFFICER", "DELIVERY_STAFF", "CUSTOMER_SUPPORT"] },
];

const STAFF_ROLES: Role[] = ["SUPER_ADMIN", "ADMIN", "PROCUREMENT_OFFICER", "DELIVERY_STAFF", "CUSTOMER_SUPPORT"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-ink-400">Loading admin panel…</div>;
  }

  if (!user || !STAFF_ROLES.includes(user.role)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-xl font-semibold text-ink-900">Staff access only</h1>
        <p className="mt-2 text-ink-500">This area is restricted to Kabul Mandawi staff accounts.</p>
        <Link href="/" className="mt-4 inline-block text-brand-700 underline">Back to home</Link>
      </div>
    );
  }

  const visibleLinks = LINKS.filter((l) => l.roles.includes(user.role));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink-900">Admin Panel</h1>
        <span className="rounded-full bg-ink-900 px-3 py-1 text-xs font-medium text-white">{user.role.replaceAll("_", " ")}</span>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-5">
        <aside className="lg:col-span-1">
          <nav className="flex flex-col gap-1 rounded-2xl border border-ink-100 p-2">
            {visibleLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-xl px-3 py-2 text-sm font-medium ${
                  pathname === l.href ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-ink-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="lg:col-span-4">{children}</div>
      </div>
    </div>
  );
}
