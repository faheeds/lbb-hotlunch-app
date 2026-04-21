"use client";

import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/", label: "Home",
    activeColor: "#16a34a",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#16a34a" : "#94a3b8"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
    )
  },
  {
    href: "/order", label: "Order",
    activeColor: "#ea580c",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#ea580c" : "#94a3b8"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    )
  },
  {
    href: "/weekly", label: "Weekly",
    activeColor: "#9333ea",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#9333ea" : "#94a3b8"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <path d="M16 2v4M8 2v4M3 10h18"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01"/>
      </svg>
    )
  },
  {
    href: "/history", label: "History",
    activeColor: "#2563eb",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563eb" : "#94a3b8"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    )
  },
  {
    href: "/account", label: "Account",
    activeColor: "#0891b2",
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? "#0891b2" : "#94a3b8"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4"/>
        <path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
      </svg>
    )
  },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="app-bnav">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <a key={item.href} href={item.href}
            className="flex-1 flex flex-col items-center gap-0.5 py-1 no-underline">
            {item.icon(active)}
            <span className="text-[9px] font-medium transition-colors"
              style={{ color: active ? item.activeColor : "#94a3b8" }}>
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
