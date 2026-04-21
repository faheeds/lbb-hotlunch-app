"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getRequiredChoicesForMenuItem } from "@/lib/menu-config";
import { cn } from "@/lib/utils";

const weekdays = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
] as const;

type ChildSummary = { id: string; schoolId: string; schoolName: string; studentName: string; grade: string };
type MenuItemSummary = { id: string; name: string; slug: string; basePriceCents: number };
type WeeklyPlanSummary = { id: string; parentChildId: string; weekday: number; menuItemId: string; menuItemName: string; choice: string | null; isActive: boolean; sortOrder: number };
type PlannerProps = { children: ChildSummary[]; menuItems: MenuItemSummary[]; existingPlans: WeeklyPlanSummary[] };
type DraftState = Record<number, { menuItemId: string; choice: string }>;

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function WeeklyPlanPlanner({ children, menuItems, existingPlans }: PlannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedChildId, setSelectedChildId] = useState(children[0]?.id ?? "");
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState<DraftState>({ 1: { menuItemId: "", choice: "" }, 2: { menuItemId: "", choice: "" }, 3: { menuItemId: "", choice: "" }, 4: { menuItemId: "", choice: "" }, 5: { menuItemId: "", choice: "" } });

  const selectedChild = children.find((c) => c.id === selectedChildId);
  const plansByWeekday = useMemo(() => {
    const filtered = existingPlans.filter((p) => p.parentChildId === selectedChildId);
    return weekdays.reduce<Record<number, WeeklyPlanSummary[]>>((acc, wd) => {
      acc[wd.value] = filtered.filter((p) => p.weekday === wd.value).sort((a, b) => a.sortOrder - b.sortOrder);
      return acc;
    }, {});
  }, [existingPlans, selectedChildId]);

  const activeDraft = drafts[selectedWeekday];
  const activeMenuItem = menuItems.find((i) => i.id === activeDraft.menuItemId);
  const activeRequiredChoices = activeMenuItem ? getRequiredChoicesForMenuItem(activeMenuItem.slug) : [];

  function updateDraft(weekday: number, next: Partial<{ menuItemId: string; choice: string }>) {
    setDrafts((cur) => ({ ...cur, [weekday]: { ...cur[weekday], ...next } }));
  }

  async function runMutation(input: { method: "POST" | "PATCH" | "DELETE"; body: Record<string, unknown> }, onSuccess?: () => void) {
    setError("");
    const response = await fetch("/api/account/weekly-plans", { method: input.method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(input.body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setError(data.error || "Unable to save changes."); return; }
    onSuccess?.();
    startTransition(() => router.refresh());
  }

  function handleAdd(weekday: number) {
    if (!selectedChild) { setError("Choose a child first."); return; }
    const draft = drafts[weekday];
    const menuItem = menuItems.find((i) => i.id === draft.menuItemId);
    if (!menuItem) { setError(`Choose an item for ${weekdays.find((d) => d.value === weekday)?.label}.`); return; }
    const required = getRequiredChoicesForMenuItem(menuItem.slug);
    if (required.length && !draft.choice) { setError(`Choose a required option for ${menuItem.name}.`); return; }
    void runMutation({ method: "POST", body: { parentChildId: selectedChild.id, weekday, menuItemId: menuItem.id, choice: draft.choice || null } }, () => updateDraft(weekday, { menuItemId: "", choice: "" }));
  }

  if (!children.length) {
    return <p className="text-[12px] text-slate-500 bg-slate-50 rounded-xl px-4 py-3">Add a saved child first to build a weekly lunch plan.</p>;
  }

  return (
    <div className="space-y-4 border-t border-slate-100 pt-4">
      {/* Child selector */}
      <div>
        <p className="text-[11px] font-semibold text-ink mb-2">1. Pick a child</p>
        <div className="flex gap-2 flex-wrap">
          {children.map((child) => (
            <button key={child.id} type="button"
              onClick={() => { setSelectedChildId(child.id); setSelectedWeekday(1); setError(""); }}
              className={cn("px-3 py-1.5 rounded-full text-[12px] font-medium border transition", child.id === selectedChildId ? "bg-ink text-white border-ink" : "bg-white text-slate-600 border-slate-200")}>
              {child.studentName}, Gr {child.grade}
            </button>
          ))}
        </div>
      </div>

      {selectedChild && (
        <>
          {/* Weekday tabs */}
          <div>
            <p className="text-[11px] font-semibold text-ink mb-2">2. Build {selectedChild.studentName}&apos;s week</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {weekdays.map((wd) => {
                const count = plansByWeekday[wd.value]?.length ?? 0;
                const active = selectedWeekday === wd.value;
                return (
                  <button key={wd.value} type="button"
                    onClick={() => { setSelectedWeekday(wd.value); setError(""); }}
                    className={cn("flex-shrink-0 rounded-xl border px-3 py-2 text-center min-w-[64px] transition", active ? "border-brand-600 bg-brand-50 border-2" : "border-slate-100 bg-white")}>
                    <p className={cn("text-[11px] font-semibold", active ? "text-brand-900" : "text-ink")}>{wd.short}</p>
                    <p className={cn("text-[9px] mt-0.5", active ? "text-brand-700" : "text-slate-400")}>{count ? `${count} set` : "Open"}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Day panel */}
          <div className="rounded-[14px] border border-slate-100 bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50 flex items-center justify-between">
              <p className="text-[13px] font-semibold text-ink">{weekdays.find((d) => d.value === selectedWeekday)?.label}</p>
              <span className="text-[10px] text-slate-400">{selectedChild.schoolName}</span>
            </div>

            {/* Existing plans */}
            {(plansByWeekday[selectedWeekday] ?? []).length > 0 ? (
              <div className="divide-y divide-slate-50">
                {(plansByWeekday[selectedWeekday] ?? []).map((plan) => (
                  <div key={plan.id} className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink">{plan.menuItemName}</p>
                      {plan.choice && <p className="text-[11px] text-slate-500">{plan.choice}</p>}
                      <p className={cn("text-[10px] font-medium mt-0.5", plan.isActive ? "text-brand-700" : "text-slate-400")}>
                        {plan.isActive ? "Active" : "Paused"}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button type="button" onClick={() => void runMutation({ method: "PATCH", body: { planId: plan.id, isActive: !plan.isActive } })}
                        className="px-2.5 py-1 rounded-full border border-slate-200 text-[11px] text-slate-600">
                        {plan.isActive ? "Pause" : "Resume"}
                      </button>
                      <button type="button" onClick={() => void runMutation({ method: "DELETE", body: { planId: plan.id } })}
                        className="px-2.5 py-1 rounded-full border border-red-200 text-[11px] text-red-700">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-[12px] text-slate-400">Nothing saved for this day yet.</p>
            )}

            {/* Add item */}
            <div className="px-4 py-3 border-t border-slate-50 bg-brand-50/50 space-y-2">
              <p className="text-[11px] font-semibold text-ink">Add an item for {weekdays.find((d) => d.value === selectedWeekday)?.label}</p>
              <select value={activeDraft.menuItemId} onChange={(e) => updateDraft(selectedWeekday, { menuItemId: e.target.value, choice: "" })}
                className="w-full rounded-xl border-slate-200 text-[13px]">
                <option value="">Choose menu item</option>
                {menuItems.map((item) => <option key={item.id} value={item.id}>{item.name} — {fmt(item.basePriceCents)}</option>)}
              </select>
              {activeRequiredChoices.length > 0 && (
                <select value={activeDraft.choice} onChange={(e) => updateDraft(selectedWeekday, { choice: e.target.value })}
                  className="w-full rounded-xl border-slate-200 text-[13px]">
                  <option value="">Choose required option</option>
                  {activeRequiredChoices.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              )}
              <button type="button" onClick={() => handleAdd(selectedWeekday)} disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-brand-700 text-white text-[13px] font-semibold disabled:opacity-50">
                Add to {weekdays.find((d) => d.value === selectedWeekday)?.label}
              </button>
            </div>
          </div>
        </>
      )}

      {error && <p className="text-[12px] text-red-700 bg-red-50 rounded-xl px-3 py-2">{error}</p>}
    </div>
  );
}
