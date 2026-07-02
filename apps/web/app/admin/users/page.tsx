"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Staff and customers are now managed on separate pages.
// This route now redirects to the dedicated Staff page.
export default function AdminUsersRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/admin/staff"); }, [router]);
  return <div className="text-ink-400">Redirecting to Staff…</div>;
}
