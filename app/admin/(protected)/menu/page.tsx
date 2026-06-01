import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { menuItemSchema, menuOptionSchema } from "@/lib/validation/order";
import { slugify } from "@/lib/utils";
import { getItemCategory, orderedCategoryList, categoryIcon } from "@/lib/categories";

export const dynamic = "force-dynamic";

// Parse a human-entered dollar amount ("12.99", "$12.99", "12") into integer
// cents. Returns null when the value is missing or not a valid, non-negative
// number so callers can show a friendly error instead of crashing.
function dollarsToCents(value: FormDataEntryValue | null): number | null {
  const cleaned = String(value ?? "").replace(/[$,\s]/g, "").trim();
  if (!cleaned) return null;
  const dollars = Number(cleaned);
  if (!Number.isFinite(dollars) || dollars < 0) return null;
  return Math.round(dollars * 100);
}

function menuItemErrorMessage(err: unknown): string {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return "An item with that name already exists. Try a different name.";
  }
  if (err instanceof Error && err.message.startsWith("Please enter")) {
    return err.message;
  }
  return "Could not add the item. Check the name and price, then try again.";
}

async function createMenuItem(formData: FormData) {
  "use server";
  let dest = "/admin/menu?created=1";
  try {
    const basePriceCents = dollarsToCents(formData.get("price"));
    if (basePriceCents === null) {
      throw new Error("Please enter a valid price, e.g. 12.99");
    }
    const parsed = menuItemSchema.parse({
      name: formData.get("name"),
      slug: slugify(String(formData.get("name") || "")),
      description: formData.get("description"),
      category: formData.get("category"),
      basePriceCents,
      isActive: formData.get("isActive") === "on"
    });
    await prisma.menuItem.create({ data: parsed });
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("createMenuItem error:", err);
    dest = `/admin/menu?error=${encodeURIComponent(menuItemErrorMessage(err))}`;
  }
  redirect(dest);
}

async function createMenuOption(formData: FormData) {
  "use server";
  let dest = "/admin/menu?optionAdded=1";
  try {
    const parsed = menuOptionSchema.parse({
      menuItemId: formData.get("menuItemId"),
      name: formData.get("name"),
      optionType: formData.get("optionType"),
      priceDeltaCents: dollarsToCents(formData.get("priceDelta")) ?? 0,
      isDefault: false,
      sortOrder: formData.get("sortOrder")
    });
    await prisma.menuOption.create({ data: parsed });
    revalidatePath("/admin/menu");
  } catch (err) {
    console.error("createMenuOption error:", err);
    dest = `/admin/menu?error=${encodeURIComponent("Could not add the option. Check the fields and try again.")}`;
  }
  redirect(dest);
}

async function updateItemCategory(formData: FormData) {
  "use server";
  let dest = "/admin/menu?moved=1";
  try {
    const id = String(formData.get("id"));
    const category = String(formData.get("category") || "").trim() || null;
    await prisma.menuItem.update({ where: { id }, data: { category } });
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("updateItemCategory error:", err);
    dest = `/admin/menu?error=${encodeURIComponent("Could not move the item. Try again.")}`;
  }
  redirect(dest);
}

async function createCategory(formData: FormData) {
  "use server";
  let dest = "/admin/menu?catCreated=1";
  try {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Please enter a category name.");
    const max = await prisma.category.aggregate({ _max: { sortOrder: true } });
    await prisma.category.create({ data: { name, sortOrder: (max._max.sortOrder ?? -1) + 1 } });
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("createCategory error:", err);
    const msg =
      err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
        ? "That category already exists."
        : err instanceof Error && err.message.startsWith("Please enter")
        ? err.message
        : "Could not create the category. Try again.";
    dest = `/admin/menu?error=${encodeURIComponent(msg)}`;
  }
  redirect(dest);
}

async function renameCategory(formData: FormData) {
  "use server";
  let dest = "/admin/menu?renamed=1";
  try {
    const from = String(formData.get("from") || "").trim();
    const to = String(formData.get("to") || "").trim();
    if (!from || !to) throw new Error("Please enter both the current and new category name.");
    if (from !== to) {
      // Reassign items explicitly set to `from`.
      await prisma.menuItem.updateMany({ where: { category: from }, data: { category: to } });
      // Items that only land in `from` via the legacy derivation (category null)
      // need an explicit assignment so the rename sticks.
      const unset = await prisma.menuItem.findMany({
        where: { category: null },
        select: { id: true, name: true, description: true }
      });
      const toFix = unset.filter((i) => getItemCategory(i) === from).map((i) => i.id);
      if (toFix.length) {
        await prisma.menuItem.updateMany({ where: { id: { in: toFix } }, data: { category: to } });
      }
      // Update the managed Category row, merging if the target name already exists.
      const row = await prisma.category.findUnique({ where: { name: from } });
      if (row) {
        const target = await prisma.category.findUnique({ where: { name: to } });
        if (target) {
          await prisma.category.delete({ where: { id: row.id } });
        } else {
          await prisma.category.update({ where: { id: row.id }, data: { name: to } });
        }
      }
    }
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("renameCategory error:", err);
    dest = `/admin/menu?error=${encodeURIComponent(
      err instanceof Error && err.message.startsWith("Please enter")
        ? err.message
        : "Could not rename the category. Try again."
    )}`;
  }
  redirect(dest);
}

async function deleteCategory(formData: FormData) {
  "use server";
  let dest = "/admin/menu?catDeleted=1";
  try {
    const id = String(formData.get("id"));
    const cat = await prisma.category.findUnique({ where: { id } });
    if (cat) {
      const count = await prisma.menuItem.count({ where: { category: cat.name } });
      if (count > 0) {
        throw new Error(`Move its ${count} item${count === 1 ? "" : "s"} to another category first.`);
      }
      await prisma.category.delete({ where: { id } });
    }
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("deleteCategory error:", err);
    dest = `/admin/menu?error=${encodeURIComponent(
      err instanceof Error && err.message.startsWith("Move its")
        ? err.message
        : "Could not delete the category. Try again."
    )}`;
  }
  redirect(dest);
}

async function reorderCategory(formData: FormData) {
  "use server";
  try {
    const id = String(formData.get("id"));
    const dir = String(formData.get("dir"));
    const all = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    const idx = all.findIndex((c) => c.id === id);
    const swapIdx = dir === "up" ? idx - 1 : idx + 1;
    if (idx !== -1 && swapIdx >= 0 && swapIdx < all.length) {
      const a = all[idx];
      const b = all[swapIdx];
      await prisma.$transaction([
        prisma.category.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
        prisma.category.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } })
      ]);
    }
    revalidatePath("/admin/menu");
    revalidatePath("/menu");
  } catch (err) {
    console.error("reorderCategory error:", err);
  }
  redirect("/admin/menu");
}

async function toggleItemActive(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const current = await prisma.menuItem.findUnique({ where: { id }, select: { isActive: true } });
  await prisma.menuItem.update({ where: { id }, data: { isActive: !current?.isActive } });
  revalidatePath("/admin/menu");
}

async function updateItemPrice(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const dollars = parseFloat(String(formData.get("price") || "0"));
  if (isNaN(dollars) || dollars < 0) throw new Error("Invalid price");
  const basePriceCents = Math.round(dollars * 100);
  await prisma.menuItem.update({ where: { id }, data: { basePriceCents } });
  revalidatePath("/admin/menu");
}

async function updateItemDescription(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const description = String(formData.get("description") || "").trim() || null;
  await prisma.menuItem.update({ where: { id }, data: { description } });
  revalidatePath("/admin/menu");
}

async function updateItemImageUrl(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const imageUrl = String(formData.get("imageUrl") || "").trim() || null;
  await prisma.menuItem.update({ where: { id }, data: { imageUrl } });
  revalidatePath("/admin/menu");
  revalidatePath("/menu");
}

export default async function AdminMenuPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    created?: string;
    optionAdded?: string;
    moved?: string;
    renamed?: string;
    catCreated?: string;
    catDeleted?: string;
  }>;
}) {
  const sp = await searchParams;
  const errorMsg = sp.error ? String(sp.error) : null;
  const successMsg = sp.created
    ? "Menu item added."
    : sp.optionAdded
    ? "Option added."
    : sp.moved
    ? "Item moved."
    : sp.renamed
    ? "Category renamed."
    : sp.catCreated
    ? "Category created."
    : sp.catDeleted
    ? "Category deleted."
    : null;

  const [items, managed] = await Promise.all([
    prisma.menuItem.findMany({
      include: { options: { orderBy: [{ optionType: "asc" }, { sortOrder: "asc" }] } },
      orderBy: { name: "asc" }
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  const managedNames = managed.map((c) => c.name);
  const categories = orderedCategoryList(managedNames, items);

  // Group by effective category across the full (managed + custom) list.
  const grouped = categories.reduce<Record<string, typeof items>>((acc, cat) => {
    acc[cat] = items.filter((i) => getItemCategory(i) === cat);
    return acc;
  }, {});
  const countFor = (name: string) => grouped[name]?.length ?? 0;

  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="space-y-5 pb-10">
      <h1 className="text-[17px] font-semibold text-ink">Menu</h1>

      {/* Shared list of category suggestions for the add / move inputs */}
      <datalist id="category-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      {errorMsg && (
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-2.5 text-[12px] font-medium text-red-700">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="rounded-[12px] border border-brand-200 bg-brand-50 px-4 py-2.5 text-[12px] font-medium text-brand-800">
          {successMsg}
        </div>
      )}

      {/* Manage categories */}
      <details className="rounded-[14px] border border-slate-100 bg-white overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
          <span className="text-[13px] font-semibold text-ink">🗂 Manage categories</span>
          <span className="text-[11px] text-slate-400">tap to expand</span>
        </summary>
        <div className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-3">
          {/* Create */}
          <form action={createCategory} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-slate-500 mb-1 block">New category</label>
              <input name="name" required placeholder="e.g. Wraps & Bowls"
                className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
            </div>
            <button type="submit"
              className="px-4 py-2 rounded-lg bg-brand-700 text-white text-[12px] font-semibold flex-shrink-0">
              Create
            </button>
          </form>

          {/* Existing managed categories */}
          {managed.length > 0 && (
            <div className="space-y-1.5">
              {managed.map((c, i) => {
                const count = countFor(c.name);
                return (
                  <div key={c.id} className="rounded-lg border border-slate-100 px-2.5 py-2 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{categoryIcon(c.name)}</span>
                      <span className="text-[12px] font-semibold text-ink flex-1 min-w-0 truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{count} {count === 1 ? "item" : "items"}</span>
                      <form action={reorderCategory} className="flex items-center gap-1 flex-shrink-0">
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" name="dir" value="up" disabled={i === 0}
                          className="w-6 h-6 rounded border border-slate-200 text-[11px] text-slate-600 disabled:opacity-30">↑</button>
                        <button type="submit" name="dir" value="down" disabled={i === managed.length - 1}
                          className="w-6 h-6 rounded border border-slate-200 text-[11px] text-slate-600 disabled:opacity-30">↓</button>
                      </form>
                      <form action={deleteCategory} className="flex-shrink-0">
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit"
                          className="px-2 py-1 rounded border border-slate-200 text-[10px] font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition">
                          Delete
                        </button>
                      </form>
                    </div>
                    <form action={renameCategory} className="flex items-center gap-1.5">
                      <input type="hidden" name="from" value={c.name} />
                      <input name="to" placeholder="Rename to…"
                        className="flex-1 rounded-lg border border-slate-200 text-[11px] px-2.5 py-1 min-w-0" />
                      <button type="submit"
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-semibold flex-shrink-0 hover:bg-slate-200 transition">
                        Rename
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
          <p className="text-[10px] text-slate-400 leading-relaxed">
            New categories appear here and in the item dropdowns even before any item uses them.
            A category must be empty before it can be deleted.
          </p>
        </div>
      </details>

      {/* Add item */}
      <details className="rounded-[14px] border border-slate-100 bg-white overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
          <span className="text-[13px] font-semibold text-ink">+ Add menu item</span>
          <span className="text-[11px] text-slate-400">tap to expand</span>
        </summary>
        <form action={createMenuItem} className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Item name</label>
              <input name="name" placeholder="e.g. Crispy Chicken Sandwich" required
                className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Price ($)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">$</span>
                <input name="price" type="number" step="0.01" min="0" inputMode="decimal"
                  placeholder="e.g. 12.99" required
                  className="w-full rounded-lg border-slate-200 text-[13px] pl-6 pr-3 py-2" />
              </div>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Category</label>
            <input name="category" list="category-options"
              placeholder="Pick one or type a new category"
              className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Description</label>
            <input name="description" placeholder="Short description for customers…"
              className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
          </div>
          <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
            <input type="checkbox" name="isActive" defaultChecked className="rounded" />
            Active (visible to customers)
          </label>
          <button type="submit"
            className="w-full py-2.5 rounded-lg bg-brand-700 text-white text-[13px] font-semibold">
            Create item
          </button>
        </form>
      </details>

      {/* Add option */}
      <details className="rounded-[14px] border border-slate-100 bg-white overflow-hidden">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none">
          <span className="text-[13px] font-semibold text-ink">+ Add option to existing item</span>
          <span className="text-[11px] text-slate-400">tap to expand</span>
        </summary>
        <form action={createMenuOption} className="px-4 pb-4 border-t border-slate-50 pt-3 space-y-2">
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Menu item</label>
            <select name="menuItemId" className="w-full rounded-lg border-slate-200 text-[13px] py-2">
              {items.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Option name</label>
              <input name="name" placeholder="e.g. Extra cheese" required
                className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Type</label>
              <select name="optionType" className="w-full rounded-lg border-slate-200 text-[13px] py-2">
                <option value="ADD_ON">Add-on</option>
                <option value="REMOVAL">Removal</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Extra charge ($, 0 = free)</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">$</span>
                <input name="priceDelta" type="number" step="0.01" min="0" inputMode="decimal"
                  defaultValue="0" required
                  className="w-full rounded-lg border-slate-200 text-[13px] pl-6 pr-3 py-2" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-slate-500 mb-1 block">Sort order</label>
              <input name="sortOrder" defaultValue="0" required
                className="w-full rounded-lg border-slate-200 text-[13px] px-3 py-2" />
            </div>
          </div>
          <button type="submit"
            className="w-full py-2.5 rounded-lg bg-brand-700 text-white text-[13px] font-semibold">
            Add option
          </button>
        </form>
      </details>

      {/* Menu items by category */}
      {categories.map((cat) => {
        const catItems = grouped[cat];
        if (!catItems?.length) return null;
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{categoryIcon(cat)}</span>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{cat}</p>
              <span className="text-[10px] text-slate-300">{catItems.length} items</span>
            </div>
            <div className="space-y-2">
              {catItems.map((item) => {
                const addons = item.options.filter((o) => o.optionType === "ADD_ON");
                const removals = item.options.filter((o) => o.optionType === "REMOVAL");
                return (
                  <details key={item.id} className="rounded-[14px] border border-slate-100 bg-white overflow-hidden">
                    <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-semibold text-ink truncate">{item.name}</p>
                          {!item.isActive && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 flex-shrink-0">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] font-semibold text-brand-700 mt-0.5">{fmt(item.basePriceCents)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-slate-400">{item.options.length} options</span>
                        <span className="text-slate-300 text-[11px]">▼</span>
                      </div>
                    </summary>

                    <div className="border-t border-slate-50 px-4 py-3 space-y-3">
                      {/* Category / move */}
                      <form action={updateItemCategory} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <label className="text-[11px] text-slate-500 flex-shrink-0">Category</label>
                        <input
                          name="category"
                          list="category-options"
                          defaultValue={getItemCategory(item)}
                          placeholder="Pick or type a category"
                          className="flex-1 rounded-lg border border-slate-200 text-[12px] px-3 py-1.5 min-w-0"
                        />
                        <button type="submit"
                          className="px-3 py-1.5 rounded-lg bg-brand-700 text-white text-[11px] font-semibold flex-shrink-0 hover:bg-brand-800 transition">
                          Move
                        </button>
                      </form>

                      {/* Photo URL */}
                      <form action={updateItemImageUrl} className="space-y-1.5">
                        <input type="hidden" name="id" value={item.id} />
                        <label className="text-[11px] text-slate-500 block">Photo URL</label>
                        <div className="flex gap-2 items-start">
                          {item.imageUrl && (
                            <img src={item.imageUrl} alt={item.name}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 border border-slate-200" />
                          )}
                          <div className="flex-1 flex gap-2">
                            <input
                              name="imageUrl"
                              type="url"
                              defaultValue={item.imageUrl ?? ""}
                              placeholder="Paste image URL from your restaurant site…"
                              className="flex-1 rounded-lg border border-slate-200 text-[12px] px-3 py-1.5 min-w-0"
                            />
                            <button type="submit"
                              className="px-3 py-1.5 rounded-lg bg-brand-700 text-white text-[11px] font-semibold flex-shrink-0 hover:bg-brand-800 transition">
                              Save
                            </button>
                          </div>
                        </div>
                      </form>

                      {/* Toggle active */}
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px]">
                          {item.description || "No description"}
                        </p>
                        <form action={toggleItemActive}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit"
                            className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition ${
                              item.isActive
                                ? "border-slate-200 text-slate-600 hover:bg-red-50 hover:border-red-200 hover:text-red-700"
                                : "border-brand-200 text-brand-700 hover:bg-brand-50"
                            }`}>
                            {item.isActive ? "Deactivate" : "Activate"}
                          </button>
                        </form>
                      </div>

                      {/* Quick price edit */}
                      <form action={updateItemPrice} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <label className="text-[11px] text-slate-500 flex-shrink-0">Price ($)</label>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[12px] text-slate-400">$</span>
                          <input
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={(item.basePriceCents / 100).toFixed(2)}
                            className="w-full rounded-lg border border-slate-200 text-[13px] pl-6 pr-3 py-1.5"
                          />
                        </div>
                        <button type="submit"
                          className="px-3 py-1.5 rounded-lg bg-brand-700 text-white text-[11px] font-semibold flex-shrink-0 hover:bg-brand-800 transition">
                          Save
                        </button>
                      </form>

                      {/* Quick description edit */}
                      <form action={updateItemDescription} className="flex items-start gap-2">
                        <input type="hidden" name="id" value={item.id} />
                        <label className="text-[11px] text-slate-500 flex-shrink-0 mt-2">Description</label>
                        <textarea
                          name="description"
                          rows={2}
                          defaultValue={item.description ?? ""}
                          placeholder="Short description for customers…"
                          className="flex-1 rounded-lg border border-slate-200 text-[12px] px-3 py-1.5 resize-none"
                        />
                        <button type="submit"
                          className="px-3 py-1.5 rounded-lg bg-brand-700 text-white text-[11px] font-semibold flex-shrink-0 hover:bg-brand-800 transition mt-0.5">
                          Save
                        </button>
                      </form>

                      {/* Add-ons */}
                      {addons.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Add-ons</p>
                          <div className="flex flex-wrap gap-1.5">
                            {addons.map((o) => (
                              <span key={o.id}
                                className="px-2.5 py-1 rounded-full text-[11px] bg-brand-50 text-brand-800 border border-brand-100">
                                + {o.name}{o.priceDeltaCents ? ` +${fmt(o.priceDeltaCents)}` : " (free)"}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Removals */}
                      {removals.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Removals</p>
                          <div className="flex flex-wrap gap-1.5">
                            {removals.map((o) => (
                              <span key={o.id}
                                className="px-2.5 py-1 rounded-full text-[11px] bg-red-50 text-red-700 border border-red-100">
                                No {o.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {item.options.length === 0 && (
                        <p className="text-[12px] text-slate-400">No options configured.</p>
                      )}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
