"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="app-header" style={{ flexDirection: "column", padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "10px 16px" }}>
        <Link href="/" className="no-underline" onClick={() => setMenuOpen(false)}>
          <p style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "#15803d", marginBottom: 1 }}>
            Local Bigger Burger
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)" }}>
            Medina Academy Hot Lunch
          </p>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isAdmin ? (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20, background: "#0f172a", color: "white" }}>
              Staff
            </span>
          ) : (
            <>
              <Link href="/account"
                style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#14532d", border: "0.5px solid rgba(15,23,42,0.1)", textDecoration: "none" }}>
                SM
              </Link>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                style={{ width: 32, height: 32, borderRadius: 8, border: "0.5px solid rgba(15,23,42,0.1)", background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}
                aria-label="Menu"
              >
                <span style={{ display: "block", width: 14, height: 1.5, background: "#0f172a", borderRadius: 2 }} />
                <span style={{ display: "block", width: 14, height: 1.5, background: "#0f172a", borderRadius: 2 }} />
                <span style={{ display: "block", width: 14, height: 1.5, background: "#0f172a", borderRadius: 2 }} />
              </button>
            </>
          )}
        </div>
      </div>

      {menuOpen && !isAdmin && (
        <nav style={{ width: "100%", borderTop: "0.5px solid rgba(15,23,42,0.08)", background: "white", padding: "8px 12px 12px" }}>
          {[
            { href: "/",        label: "Home" },
            { href: "/order",   label: "Order lunch" },
            { href: "/weekly",  label: "Weekly plan" },
            { href: "/history", label: "Order history" },
            { href: "/account", label: "My account" },
          ].map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              style={{ display: "block", padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: pathname === item.href ? 600 : 400, color: pathname === item.href ? "#15803d" : "#334155", background: pathname === item.href ? "#f0fdf4" : "transparent", textDecoration: "none", marginBottom: 2 }}>
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "0.5px solid rgba(15,23,42,0.08)", marginTop: 8, paddingTop: 8 }}>
            <Link href="/admin/login" onClick={() => setMenuOpen(false)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 500, color: "#64748b", textDecoration: "none" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Admin login
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
