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

// Keep these role groups in sync with the backend ROLES groups in
// apps/api/src/middleware/rbac.ts — the backend is what actually enforces access;
// this list just decides which menu items each role sees.
const ANY_ADMIN: Role[] = ["SUPER_ADMIN", "ADMIN"];
const ALL_STAFF: Role[] = [
  "SUPER_ADMIN", "ADMIN",
  "OPERATIONS_MANAGER", "INVENTORY_MANAGER", "FINANCE_OFFICER", "DELIVERY_COORDINATOR", "MARKETING_MANAGER",
  "PROCUREMENT_OFFICER", "DELIVERY_STAFF", "CUSTOMER_SUPPORT",
];
const CATALOG: Role[] = ["SUPER_ADMIN", "ADMIN", "INVENTORY_MANAGER", "MARKETING_MANAGER"];
const ORDERS_VIEW: Role[] = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "FINANCE_OFFICER", "DELIVERY_COORDINATOR", "MARKETING_MANAGER", "PROCUREMENT_OFFICER", "CUSTOMER_SUPPORT"];
const SUPPORT: Role[] = ["SUPER_ADMIN", "ADMIN", "CUSTOMER_SUPPORT", "OPERATIONS_MANAGER"];
const REFUND_VIEW: Role[] = ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "CUSTOMER_SUPPORT", "OPERATIONS_MANAGER"];
const ANALYTICS: Role[] = ["SUPER_ADMIN", "ADMIN", "OPERATIONS_MANAGER", "FINANCE_OFFICER", "MARKETING_MANAGER"];

const LINKS: NavLink[] = [
  { href: "/admin", label: "Overview", roles: ANALYTICS },
  { href: "/admin/orders", label: "Orders", roles: ORDERS_VIEW },
  { href: "/admin/deliveries", label: "My Deliveries", roles: ["DELIVERY_STAFF", "DELIVERY_COORDINATOR"] },
  { href: "/admin/products", label: "Products", roles: CATALOG },
  { href: "/admin/categories", label: "Categories", roles: CATALOG },
  { href: "/admin/custom-requests", label: "Custom Requests", roles: SUPPORT },
  { href: "/admin/refunds", label: "Refunds", roles: REFUND_VIEW },
  { href: "/admin/messages", label: "Messages", roles: SUPPORT },
  { href: "/admin/customers", label: "Customers", roles: ANY_ADMIN },
  { href: "/admin/staff", label: "Staff", roles: ["SUPER_ADMIN"] },
  { href: "/admin/account", label: "My Account", roles: ALL_STAFF },
];

const STAFF_ROLES: Role[] = ALL_STAFF;

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
