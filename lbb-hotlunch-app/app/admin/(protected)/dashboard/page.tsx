import { getAdminDashboardSummary } from "@/lib/admin";
import { formatInTimeZone } from "date-fns-tz";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const summary = await getAdminDashboardSummary();

  const stats = [
    { label: "Paid orders", value: summary.paidOrders },
    { label: "Refunded", value: summary.refundedOrders },
    { label: "Cancelled", value: summary.cancelledOrders },
    { label: "Schools", value: summary.schools },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-brand-700 mb-0.5">Overview</p>
        <h1 className="text-xl font-semibold text-ink">School lunch operations</h1>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-[16px] bg-white border border-slate-100 p-4 text-center">
            <p className="text-[28px] font-semibold text-ink">{value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[18px] border border-slate-100 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-50">
          <p className="text-[13px] font-semibold text-ink">Upcoming delivery dates</p>
        </div>
        <div className="divide-y divide-slate-50">
          {summary.upcomingDeliveryDates.map((date) => (
            <div key={date.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-ink">{date.school.name}</p>
                <p className="text-[11px] text-slate-500">{formatInTimeZone(date.deliveryDate, date.school.timezone, "EEEE, MMMM d")}</p>
                <p className="text-[10px] text-slate-400">Cutoff: {formatInTimeZone(date.cutoffAt, date.school.timezone, "MMM d h:mm a zzz")}</p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-brand-100 text-brand-900">Open</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
