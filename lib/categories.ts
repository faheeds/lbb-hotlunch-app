// Shared menu-category helpers.
//
// Categories are stored as a free-text `category` field on each MenuItem.
// For backward compatibility, items created before this field existed
// (category === null) fall back to the legacy convention where the category
// was encoded as the first sentence of the description, or inferred from the
// item name. The four DEFAULT_CATEGORIES always appear (even when empty) so the
// admin and storefront keep a stable, ordered backbone; any custom category an
// admin types on an item shows up automatically.
//
// This module is intentionally pure (no prisma / server-only imports) so it can
// be used from both server components and client components.

export const DEFAULT_CATEGORIES = [
  "Signature Burgers & Sandwiches",
  "Salads with Protein",
  "Comfort Favorites",
  "Sides & Snacks",
] as const;

export type CategoryMeta = { icon: string; gradient: string; label: string };

export const DEFAULT_CATEGORY_ICON = "🍽";
export const DEFAULT_CATEGORY_GRADIENT =
  "linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)";

const CATEGORY_META: Record<string, CategoryMeta> = {
  "Signature Burgers & Sandwiches": {
    icon: "🍔",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
    label: "Burgers & Sandwiches",
  },
  "Salads with Protein": {
    icon: "🥗",
    gradient: "linear-gradient(135deg, #86efac 0%, #22c55e 100%)",
    label: "Salads",
  },
  "Comfort Favorites": {
    icon: "🍗",
    gradient: "linear-gradient(135deg, #fca5a5 0%, #ef4444 100%)",
    label: "Comfort Favorites",
  },
  "Sides & Snacks": {
    icon: "🍟",
    gradient: "linear-gradient(135deg, #fed7aa 0%, #f97316 100%)",
    label: "Sides & Snacks",
  },
};

export type Categorizable = {
  name: string;
  description: string | null;
  category?: string | null;
};

function isDefaultCategory(value: string): boolean {
  return (DEFAULT_CATEGORIES as readonly string[]).includes(value);
}

// Legacy derivation: description prefix first, then name keywords.
function deriveCategory(item: Categorizable): string {
  const prefix = item.description?.split(".")[0]?.trim();
  if (prefix && isDefaultCategory(prefix)) return prefix;
  const n = item.name;
  if (n.includes("Burger") || n.includes("Sandwich")) return "Signature Burgers & Sandwiches";
  if (n.includes("Salad")) return "Salads with Protein";
  if (n.includes("Mac") || n.includes("Quesadilla") || n.includes("Wings") || n.includes("Tender"))
    return "Comfort Favorites";
  return "Sides & Snacks";
}

// Effective category for an item: the explicit field wins; otherwise fall back
// to the legacy derivation so pre-existing items keep their grouping.
export function getItemCategory(item: Categorizable): string {
  const explicit = item.category?.trim();
  return explicit && explicit.length > 0 ? explicit : deriveCategory(item);
}

// Strip a leading "Category. " prefix from a description for display, so legacy
// items don't show the category name inside their own description text.
export function cleanDescription(item: Categorizable): string {
  const desc = item.description ?? "";
  const parts = desc.split(". ");
  if (parts.length > 1 && isDefaultCategory(parts[0].trim())) {
    return parts.slice(1).join(". ").trim();
  }
  return desc;
}

// Ordered, de-duplicated category list: the four defaults first (in order),
// then any custom categories present on the given items, sorted alphabetically.
export function getCategoryList(items: Categorizable[]): string[] {
  const present = new Set(items.map(getItemCategory));
  const customs = [...present]
    .filter((c) => !isDefaultCategory(c))
    .sort((a, b) => a.localeCompare(b));
  return [...DEFAULT_CATEGORIES, ...customs];
}

export function categoryMeta(cat: string): CategoryMeta {
  return (
    CATEGORY_META[cat] ?? {
      icon: DEFAULT_CATEGORY_ICON,
      gradient: DEFAULT_CATEGORY_GRADIENT,
      label: cat,
    }
  );
}

export function categoryIcon(cat: string): string {
  return categoryMeta(cat).icon;
}

export function categoryAnchorId(cat: string): string {
  return `cat-${cat.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;
}

// Build an ordered category list when an admin-defined (managed) ordering
// exists: managed names keep their given order; any category present on items
// but not in the managed list is appended (sorted). Empty managed categories
// are preserved so they remain visible/manageable even with zero items.
export function orderedCategoryList(
  managedNames: string[],
  items: Categorizable[]
): string[] {
  const seen = new Set<string>();
  const managed: string[] = [];
  for (const n of managedNames) {
    const name = n.trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      managed.push(name);
    }
  }
  const orphans = [...new Set(items.map(getItemCategory))]
    .filter((c) => !seen.has(c))
    .sort((a, b) => a.localeCompare(b));
  return [...managed, ...orphans];
}
