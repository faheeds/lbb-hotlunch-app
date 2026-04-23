"use client";

import { useState } from "react";
import Link from "next/link";

type MenuOption = {
  id: string;
  name: string;
  optionType: "ADD_ON" | "REMOVAL";
  priceDeltaCents: number;
};

type MenuItem = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  basePriceCents: number;
  options: MenuOption[];
};

type Props = {
  item: MenuItem;
  categoryIcon: string;
  categoryGradient: string;
};

function stripCategoryPrefix(description: string | null): string | null {
  if (!description) return null;
  // Descriptions are stored as "Category Name. Actual description text."
  const match = description.match(/^[^.]+\.\s*([\s\S]*)/);
  return match ? match[1].trim() || null : description;
}

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function MenuItemCard({ item, categoryIcon, categoryGradient }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const imageUrl = `https://medina.localbiggerburger.com/food/${item.slug}.jpeg`;
  const description = stripCategoryPrefix(item.description);
  const addons = item.options.filter((o) => o.optionType === "ADD_ON");
  const removals = item.options.filter((o) => o.optionType === "REMOVAL");

  return (
    <div style={{
      background: "white",
      borderRadius: 18,
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Photo or gradient placeholder */}
      <div style={{ position: "relative", height: 160, overflow: "hidden", flexShrink: 0 }}>
        {!imgFailed ? (
          <img
            src={imageUrl}
            alt={item.name}
            onError={() => setImgFailed(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            background: categoryGradient,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48,
          }}>
            {categoryIcon}
          </div>
        )}
        {/* Price badge */}
        <div style={{
          position: "absolute", bottom: 10, right: 10,
          background: "rgba(28,5,5,0.82)",
          backdropFilter: "blur(6px)",
          borderRadius: 10, padding: "4px 10px",
          fontSize: 13, fontWeight: 700, color: "#fbbf24",
          letterSpacing: "0.01em",
        }}>
          {fmt(item.basePriceCents)}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{ fontSize: 15, fontWeight: 700, color: "#1c0505", lineHeight: 1.2, margin: 0 }}>
          {item.name}
        </p>

        {description && (
          <p style={{ fontSize: 12, color: "#6b7280", lineHeight: 1.55, margin: 0 }}>
            {description}
          </p>
        )}

        {/* Add-ons */}
        {addons.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 5 }}>
              Add-ons available
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {addons.map((o) => (
                <span key={o.id} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 20,
                  background: "#fef3c7", color: "#92400e",
                  border: "1px solid #fde68a", fontWeight: 500,
                }}>
                  + {o.name}{o.priceDeltaCents ? ` (${fmt(o.priceDeltaCents)})` : " (free)"}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Removals */}
        {removals.length > 0 && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9ca3af", marginBottom: 5 }}>
              Can remove
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {removals.map((o) => (
                <span key={o.id} style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 20,
                  background: "#fef2f2", color: "#991b1b",
                  border: "1px solid #fecaca", fontWeight: 500,
                }}>
                  No {o.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order CTA */}
      <div style={{ padding: "0 16px 16px" }}>
        <Link href="/order" style={{
          display: "block", textAlign: "center",
          background: "#c41230", color: "white",
          borderRadius: 10, padding: "10px 16px",
          fontSize: 13, fontWeight: 600, textDecoration: "none",
          letterSpacing: "0.01em",
        }}>
          Order this item →
        </Link>
      </div>
    </div>
  );
}
