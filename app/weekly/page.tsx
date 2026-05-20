import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/parent-auth";
import { ALLOWED_SCHOOL_SLUGS } from "@/lib/school-config";
import { getUpcomingOrderingWindowRange, getWeekdayNumber } from "@/lib/weekly-week";
import { SiteHeader } from "@/components/site-header";
import { AppNav } from "@/components/app-nav";
import { WeeklyPlanPlanner } from "@/components/account/weekly-plan-planner";
import { WeeklyCheckoutButton } from "@/components/account/weekly-checkout-button";

export const dynamic = "force-dynamic";

const WEEKDAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday"
};

export default async function WeeklyPage() {
  const session = await requireParent();
  const parentUserId = session.user?.parentUserId;
  if (!parentUserId) redirect("/account/sign-in");

  const parent = await prisma.parentUser.findUnique({
    where: { id: parentUserId },
    include: {
      children: {
        where: { archivedAt: null },
        include: { school: true },
        orderBy: { studentName: "asc" }
      },
      weeklyPlans: {
        where: { parentChild: { archivedAt: null } },
        include: { parentChild: true, menuItem: true, school: true },
        orderBy: [{ weekday: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!parent) redirect("/account/sign-in");

  // Load upcoming delivery dates per the child's schools, constrained to the
  // ordering window (today through next Friday). This mirrors the single-day
  // order flow so the planner only offers weekdays that are actually bookable.
  const now = new Date();
  const primaryTimezone = parent.children[0]?.school.timezone ?? "America/Los_Angeles";
  const range = getUpcomingOrderingWindowRange(now, primaryTimezone);
  const schoolIds = [...new Set(parent.children.map((c) => c.schoolId))];

  const allDeliveryDatesInWindow = schoolIds.length
    ? await prisma.deliveryDate.findMany({
        where: {
          schoolId: { in: schoolIds },
          orderingOpen: true,
          deliveryDate: { gte: range.start, lte: range.end },
          school: { isActive: true, slug: { in: [...ALLOWED_SCHOOL_SLUGS] } }
        },
        include: {
          school: true,
          menuAvailability: {
            where: { isAvailable: true, menuItem: { is: { isActive: true } } },
            include: {
              menuItem: {
                include: { options: { orderBy: { sortOrder: "asc" } } }
              }
            }
          }
        },
        orderBy: { deliveryDate: "asc" }
      })
    : [];

  // Auto-purge weekly plans whose matching delivery date has passed cutoff. These
  // would block weekly checkout (lib/weekly-checkout.ts treats them as fatal) and
  // are no longer editable from the planner — the day's tab disappears once its
  // delivery date drops out of the open list. Plans whose weekday has no
  // scheduled delivery date at all are left alone (may belong to a future cycle).
  const orphanedPlans = parent.weeklyPlans.filter((plan) => {
    const match = allDeliveryDatesInWindow.find(
      (d) =>
        d.schoolId === plan.schoolId &&
        getWeekdayNumber(d.deliveryDate, d.school.timezone) === plan.weekday
    );
    return match !== undefined && match.cutoffAt <= now;
  });

  let purgedItems: { weekday: number; weekdayLabel: string; studentName: string; menuItemName: string }[] = [];
  if (orphanedPlans.length) {
    await prisma.weeklyLunchPlan.deleteMany({
      where: {
        parentUserId,
        id: { in: orphanedPlans.map((p) => p.id) }
      }
    });
    purgedItems = orphanedPlans.map((p) => ({
      weekday: p.weekday,
      weekdayLabel: WEEKDAY_LABELS[p.weekday] ?? `Day ${p.weekday}`,
      studentName: p.parentChild.studentName,
      menuItemName: p.menuItem.name
    }));
  }

  const orphanedIds = new Set(orphanedPlans.map((p) => p.id));
  const remainingPlans = parent.weeklyPlans.filter((p) => !orphanedIds.has(p.id));
  const deliveryDates = allDeliveryDatesInWindow.filter((d) => d.cutoffAt > now);
  const activeWeeklyPlanCount = remainingPlans.filter((p) => p.isActive).length;

  return (
    <>
      <SiteHeader />
      <main className="app-content pb-32">
        <div className="px-4 py-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700 mb-0.5">Meal planning</p>
          <h1 className="text-[20px] font-semibold text-ink mb-1">Weekly lunch plan</h1>
          <p className="text-[12px] text-slate-500 leading-relaxed mb-3">
            Plan a meal for each upcoming day — we&apos;ll bundle it into one checkout for the whole week.
          </p>
          <div className="rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 mb-4 text-[12.5px] text-amber-900 leading-relaxed">
            <span className="font-semibold">Note:</span> Hot lunch is available for Kindergarten through Grade 10 only. We are not currently serving Pre-K or Preschool students.
          </div>

          <div className="rounded-[18px] border border-slate-100 bg-white p-4">
            <WeeklyPlanPlanner
              children={parent.children.map((c) => ({
                id: c.id,
                schoolId: c.schoolId,
                schoolName: c.school.name,
                timezone: c.school.timezone,
                studentName: c.studentName,
                grade: c.grade
              }))}
              deliveryDates={deliveryDates.map((date) => ({
                id: date.id,
                schoolId: date.schoolId,
                deliveryDate: date.deliveryDate.toISOString(),
                cutoffAt: date.cutoffAt.toISOString(),
                school: {
                  id: date.school.id,
                  name: date.school.name,
                  timezone: date.school.timezone
                },
                menuItems: date.menuAvailability.map((entry) => ({
                  id: entry.menuItem.id,
                  slug: entry.menuItem.slug,
                  name: entry.menuItem.name,
                  description: entry.menuItem.description,
                  basePriceCents: entry.menuItem.basePriceCents,
                  options: entry.menuItem.options.map((o) => ({
                    id: o.id,
                    name: o.name,
                    optionType: o.optionType,
                    priceDeltaCents: o.priceDeltaCents
                  }))
                }))
              }))}
              existingPlans={remainingPlans.map((p) => ({
                id: p.id,
                parentChildId: p.parentChildId,
                weekday: p.weekday,
                menuItemId: p.menuItemId,
                menuItemName: p.menuItem.name,
                choice: p.choice,
                additions: p.additions,
                removals: p.removals,
                isActive: p.isActive,
                sortOrder: p.sortOrder
              }))}
              purgedItems={purgedItems}
              upcomingCutoffs={deliveryDates.map((d) => d.cutoffAt.toISOString())}
            />
          </div>
        </div>
      </main>

      {/* Sticky checkout bar */}
      <div className="fixed inset-x-0 bottom-[52px] z-20 px-4 pb-2" style={{ maxWidth: 480, margin: "0 auto", left: 0, right: 0 }}>
        <div className="rounded-[18px] border border-brand-200 bg-white/97 backdrop-blur px-4 py-3 shadow-soft flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-brand-700">Upcoming week</p>
            <p className="text-[12px] text-slate-600 mt-0.5">
              {activeWeeklyPlanCount
                ? `${activeWeeklyPlanCount} planned item${activeWeeklyPlanCount === 1 ? "" : "s"} ready for checkout`
                : "Add items to your week plan"}
            </p>
          </div>
          <WeeklyCheckoutButton label="Checkout week" fullWidth={false} />
        </div>
      </div>
      <AppNav />
    </>
  );
}
