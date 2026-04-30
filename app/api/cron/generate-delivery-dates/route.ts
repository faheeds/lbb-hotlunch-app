import { NextRequest, NextResponse } from "next/server";
import { addDays, startOfDay } from "date-fns";
import { fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { prisma } from "@/lib/db";
import { ALLOWED_SCHOOL_SLUGS } from "@/lib/school-config";

const TIMEZONE = "America/Los_Angeles";

// Called by Vercel Cron every Friday at 6 PM Pacific (UTC schedule below).
// Generates Mon–Thu delivery dates for the following week for all active schools.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schools = await prisma.school.findMany({
    where: { isActive: true, slug: { in: [...ALLOWED_SCHOOL_SLUGS] } }
  });

  const menuItems = await prisma.menuItem.findMany({
    where: { isActive: true },
    select: { id: true }
  });

  // Find the coming Monday (next week's Mon from today/Friday)
  const now = new Date();
  const todayPacific = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");
  const todayDate = new Date(todayPacific + "T00:00:00");
  const dayOfWeek = todayDate.getDay(); // 5 = Friday
  const daysUntilMonday = dayOfWeek === 5 ? 3 : (8 - dayOfWeek) % 7 || 7;
  const nextMonday = startOfDay(addDays(todayDate, daysUntilMonday));

  const created: string[] = [];
  const skipped: string[] = [];

  for (const school of schools) {
    for (let dayOffset = 0; dayOffset <= 3; dayOffset++) {
      // Mon=0, Tue=1, Wed=2, Thu=3
      const deliveryDay = addDays(nextMonday, dayOffset);
      const deliveryDateISO = formatInTimeZone(deliveryDay, TIMEZONE, "yyyy-MM-dd");

      // Delivery at 11 AM Pacific
      const deliveryAt = fromZonedTime(`${deliveryDateISO} 11:00:00`, TIMEZONE);

      // Cutoff at 9 PM Pacific the day before
      const priorDayISO = formatInTimeZone(addDays(deliveryDay, -1), TIMEZONE, "yyyy-MM-dd");
      const cutoffAt = fromZonedTime(`${priorDayISO} 21:00:00`, TIMEZONE);

      // Skip if already exists
      const existing = await prisma.deliveryDate.findUnique({
        where: { schoolId_deliveryDate: { schoolId: school.id, deliveryDate: deliveryAt } }
      });

      if (existing) {
        skipped.push(`${school.name} ${deliveryDateISO}`);
        continue;
      }

      const dd = await prisma.deliveryDate.create({
        data: { schoolId: school.id, deliveryDate: deliveryAt, cutoffAt, orderingOpen: true }
      });

      // Attach all active menu items
      if (menuItems.length) {
        await prisma.deliveryMenuItem.createMany({
          data: menuItems.map((item) => ({
            deliveryDateId: dd.id,
            menuItemId: item.id,
            schoolId: school.id,
            isAvailable: true
          })),
          skipDuplicates: true
        });
      }

      created.push(`${school.name} ${deliveryDateISO}`);
    }
  }

  return NextResponse.json({ created, skipped });
}
