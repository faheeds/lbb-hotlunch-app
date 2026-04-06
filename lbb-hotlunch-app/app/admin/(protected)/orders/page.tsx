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

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ deliveryDateId?: string; schoolIds?: string | string[]; status?: string; archived?: string }> }) {
  const params = await searchParams;
  const selectedSchoolIds = normalizeMultiValue(params.schoolIds);

  const [orders, schools, deliveryDates] = await Promise.all([
    listOrders({ deliveryDateId: params.deliveryDateId, schoolIds: selectedSchoolIds, status: params.status, archived: params.archived }),
    prisma.school.findMany({ where: { isActive: true, slug: { in: [...ALLOWED_SCHOOL_SLUGS] } }, orderBy: { name: "asc" } }),
    prisma.deliveryDate.findMany({
      where: { school: { slug: { in: [...ALLOWED_SCHOOL_SLUGS] } }, schoolId: selectedSchoolIds.length ? { in: selectedSchoolIds } : undefined },
      include: { school: true },
      orderBy: { deliveryDate: "asc" }
    })
  ]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700 mb-0.5">Orders</p>
        <h1 className="text-xl font-semibold text-ink">Filter, export &amp; manage orders</h1>
      </div>

      <div className="rounded-[18px] border border-slate-100 bg-white p-4 space-y-3">
        <form className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <select name="schoolIds" multiple defaultValue={selectedSchoolIds} className="rounded-xl border-slate-200 text-[13px] min-h-[80px]">
            {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="deliveryDateId" defaultValue={params.deliveryDateId ?? ""} className="rounded-xl border-slate-200 text-[13px]">
            <option value="">All dates</option>
            {deliveryDates.map((d) => <option key={d.id} value={d.id}>{formatInTimeZone(d.deliveryDate, d.school.timezone, "EEE, MMM d")}</option>)}
          </select>
          <select name="status" defaultValue={params.status ?? "ALL"} className="rounded-xl border-slate-200 text-[13px]">
            <option value="ALL">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="REFUNDED">Refunded</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select name="archived" defaultValue={params.archived ?? "exclude"} className="rounded-xl border-slate-200 text-[13px]">
            <option value="exclude">Active only</option>
            <option value="include">Active + archived</option>
            <option value="only">Archived only</option>
          </select>
          <button type="submit" className="col-span-2 sm:col-span-4 px-4 py-2.5 rounded-xl bg-brand-700 text-white text-[13px] font-semibold">
            Apply filters
          </button>
        </form>
        <p className="text-[11px] text-slate-400">Hold Ctrl / Cmd to select multiple schools.</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/admin/orders/labels-print${params.deliveryDateId ? `?deliveryDateId=${params.deliveryDateId}` : ""}`}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[12px] text-slate-600 no-underline">Print labels</Link>
          <a href={`/api/admin/labels${params.deliveryDateId ? `?deliveryDateId=${params.deliveryDateId}` : ""}`} target="_blank" rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[12px] text-slate-600 no-underline">Labels PDF</a>
          <a href={`/api/admin/export${params.deliveryDateId ? `?deliveryDateId=${params.deliveryDateId}` : ""}`}
            className="px-3 py-1.5 rounded-full border border-slate-200 text-[12px] text-slate-600 no-underline">Export CSV</a>
        </div>
      </div>

      <OrdersList orders={orders} />
    </div>
  );
}
