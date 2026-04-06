"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/",        label: "Home",    icon: "🏠" },
  { href: "/order",   label: "Order",   icon: "🍔" },
  { href: "/weekly",  label: "Weekly",  icon: "📅" },
  { href: "/history", label: "History", icon: "📋" },
  { href: "/account", label: "Account", icon: "👤" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-bnav">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <a
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 no-underline"
          >
            <span className="text-[18px] leading-none">{item.icon}</span>
            <span className={cn("text-[9px]", active ? "text-brand-700 font-semibold" : "text-slate-400")}>
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
