import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireParent } from "@/lib/parent-auth";
import { ALLOWED_SCHOOL_SLUGS } from "@/lib/school-config";
import { SiteHeader } from "@/components/site-header";
import { AppNav } from "@/components/app-nav";
import { WeeklyPlanPlanner } from "@/components/account/weekly-plan-planner";
import { WeeklyCheckoutButton } from "@/components/account/weekly-checkout-button";

export const dynamic = "force-dynamic";

export default async function WeeklyPage() {
  const session = await requireParent();
  const parentUserId = session.user?.parentUserId;
  if (!parentUserId) redirect("/account/sign-in");

  const [parent, menuItems] = await Promise.all([
    prisma.parentUser.findUnique({
      where: { id: parentUserId },
      include: {
        children: { where: { archivedAt: null }, include: { school: true }, orderBy: { studentName: "asc" } },
        weeklyPlans: {
          where: { parentChild: { archivedAt: null } },
          include: { parentChild: true, menuItem: true, school: true },
          orderBy: [{ weekday: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    }),
    prisma.menuItem.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  if (!parent) redirect("/account/sign-in");

  const activeWeeklyPlanCount = parent.weeklyPlans.filter((p) => p.isActive).length;

  return (
    <>
      <SiteHeader />
      <main className="app-content pb-32">
        <div className="px-4 py-4">
          <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700 mb-0.5">Meal planning</p>
          <h1 className="text-[20px] font-semibold text-ink mb-1">Weekly lunch plan</h1>
          <p className="text-[12px] text-slate-500 leading-relaxed mb-4">
            Set a default meal per weekday. We'll pre-fill when that date opens — one checkout for the whole week.
          </p>

          <div className="rounded-[18px] border border-slate-100 bg-white p-4">
            <WeeklyPlanPlanner
              children={parent.children.map((c) => ({ id: c.id, schoolId: c.schoolId, schoolName: c.school.name, studentName: c.studentName, grade: c.grade }))}
              menuItems={menuItems.map((i) => ({ id: i.id, name: i.name, slug: i.slug, basePriceCents: i.basePriceCents }))}
              existingPlans={parent.weeklyPlans.map((p) => ({ id: p.id, parentChildId: p.parentChildId, weekday: p.weekday, menuItemId: p.menuItemId, menuItemName: p.menuItem.name, choice: p.choice, isActive: p.isActive, sortOrder: p.sortOrder }))}
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
