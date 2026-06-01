import Link from "next/link";
import { prisma } from "@/lib/db";
import { listOrders } from "@/lib/orders";
import { ALLOWED_SCHOOL_SLUGS } from "@/lib/school-config";
import { OrdersList } from "@/components/admin/orders-list";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

function normalizeMultiValue(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

export default async function AdminOrdersPage({
  searchParams
}: {
  searchParams: Promise<{ deliveryDate?: string; schoolIds?: string | string[]; status?: string; archived?: string }>;
}) {
  const params = await searchParams;
  const selectedSchoolIds = normalizeMultiValue(params.schoolIds);
  const selectedDate = params.deliveryDate ?? "";

  const [schools, allDeliveryDates] = await Promise.all([
    prisma.school.findMany({ where: { isActive: true, slug: { in: [...ALLOWED_SCHOOL_SLUGS] } }, orderBy: { name: "asc" } }),
    prisma.deliveryDate.findMany({
      where: { school: { slug: { in: [...ALLOWED_SCHOOL_SLUGS] } } },
      include: { school: true },
      orderBy: { deliveryDate: "asc" }
    })
  ]);

  // Distinct calendar dates across all schools (a date is shared by both
  // schools, so we key the filter on the calendar day rather than a single
  // per-school delivery-date row). Insertion order is chronological.
  const dateOptions: { value: string; label: string }[] = [];
  const seenDates = new Set<string>();
  for (const d of allDeliveryDates) {
    const value = formatInTimeZone(d.deliveryDate, d.school.timezone, "yyyy-MM-dd");
    if (seenDates.has(value)) continue;
    seenDates.add(value);
    dateOptions.push({ value, label: formatInTimeZone(d.deliveryDate, d.school.timezone, "EEE MMM d") });
  }

  // All delivery-date rows (both schools) that fall on the selected calendar day.
  const matchingDateIds = selectedDate
    ? allDeliveryDates
        .filter((d) => formatInTimeZone(d.deliveryDate, d.school.timezone, "yyyy-MM-dd") === selectedDate)
        .map((d) => d.id)
    : undefined;

  const orders = await listOrders({
    deliveryDateIds: matchingDateIds,
    schoolIds: selectedSchoolIds,
    status: params.status,
    archived: params.archived
  });

  // Keep CSV / labels / print in sync with the on-screen filter.
  const exportQs = new URLSearchParams();
  if (selectedDate) exportQs.set("deliveryDate", selectedDate);
  for (const sid of selectedSchoolIds) exportQs.append("schoolIds", sid);
  const qs = exportQs.toString() ? `?${exportQs.toString()}` : "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[17px] font-semibold text-ink">Orders</h1>
        <div className="flex gap-2">
          <a href={`/api/admin/export${qs}`}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] text-slate-600 no-underline">CSV</a>
          <a href={`/api/admin/labels${qs}`}
            target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] text-slate-600 no-underline">Labels PDF</a>
          <Link href={`/admin/orders/labels-print${qs}`}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[11px] text-slate-600 no-underline">Print</Link>
        </div>
      </div>

      <form className="rounded-[14px] border border-slate-100 bg-white p-3">
        <div className="grid grid-cols-2 gap-2 mb-2">
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Schools (leave empty for all)</label>
            <select name="schoolIds" multiple defaultValue={selectedSchoolIds}
              className="w-full rounded-lg border-slate-200 text-[12px] py-1.5 min-h-[56px]">
              {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <select name="deliveryDate" defaultValue={selectedDate}
              className="rounded-lg border-slate-200 text-[12px] py-1.5">
              <option value="">All dates</option>
              {dateOptions.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <select name="status" defaultValue={params.status ?? "ALL"}
              className="rounded-lg border-slate-200 text-[12px] py-1.5">
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PAID">Paid</option>
              <option value="REFUNDED">Refunded</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <select name="archived" defaultValue={params.archived ?? "exclude"}
              className="rounded-lg border-slate-200 text-[12px] py-1.5">
              <option value="exclude">Active only</option>
              <option value="include">Active + archived</option>
              <option value="only">Archived only</option>
            </select>
          </div>
        </div>
        <button type="submit"
          className="w-full py-2 rounded-lg bg-brand-700 text-white text-[12px] font-semibold">
          Apply filters
        </button>
      </form>

      <OrdersList orders={orders} />
    </div>
  );
}
