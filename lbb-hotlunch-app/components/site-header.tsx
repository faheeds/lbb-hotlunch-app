"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="app-header">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-brand-700">Local Bigger Burger</p>
        <p className="text-[14px] font-semibold text-ink leading-tight">Medina Academy Hot Lunch</p>
      </div>
      <div className="flex items-center gap-2">
        {isAdmin ? (
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-ink text-white">Staff</span>
        ) : (
          <Link
            href="/account"
            className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-[11px] font-semibold text-brand-900 border border-slate-100"
          >
            SM
          </Link>
        )}
      </div>
    </header>
  );
}
