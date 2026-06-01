import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { mapOrderToLabelRows } from "@/lib/pdf/labels";
import { resolveDeliveryDateIds } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function LabelsPrintPage({
  searchParams
}: {
  searchParams: Promise<{ deliveryDate?: string; schoolIds?: string | string[]; dateFrom?: string; dateTo?: string }>;
}) {
  const params = await searchParams;
  const schoolIds = Array.isArray(params.schoolIds)
    ? params.schoolIds.filter(Boolean)
    : params.schoolIds
    ? [params.schoolIds]
    : [];
  const deliveryDateIds = await resolveDeliveryDateIds(params.deliveryDate);
  const dateFrom = params.dateFrom || undefined;
  const dateTo = params.dateTo || undefined;
  const orders = await prisma.order.findMany({
    where: {
      deliveryDateId: deliveryDateIds ? { in: deliveryDateIds } : undefined,
      schoolId: schoolIds.length ? { in: schoolIds } : undefined,
      deliveryDate:
        dateFrom || dateTo
          ? {
              deliveryDate: {
                gte: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
                lte: dateTo ? new Date(`${dateTo}T23:59:59.999`) : undefined
              }
            }
          : undefined,
      status: OrderStatus.PAID,
      archivedAt: null
    },
    include: {
      school: true,
      deliveryDate: true,
      student: true,
      items: true
    },
    orderBy: { createdAt: "asc" }
  });

  const labels = mapOrderToLabelRows(orders);

  return (
    <main className="min-h-screen bg-white p-6 print:p-0">
      <style>{`
        @media print {
          .label-grid { gap: 8px; }
          .label-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>
      <div className="label-grid grid grid-cols-2 gap-3">
        {labels.map((label) => (
          <div key={label.orderId} className="label-card rounded-xl border border-slate-300 p-3 text-[12px] leading-4">
            <>
              <p className="text-base font-bold">{label.studentName}</p>
              <p>
                Grade {label.grade}{label.classroom ? ` · Room ${label.classroom}` : ""} · {label.school}
              </p>
              <p className="mt-2 text-base font-bold">{label.itemName}</p>
              <p>Add: {label.additions.length ? label.additions.join(", ") : "None"}</p>
              <p>No: {label.removals.length ? label.removals.join(", ") : "None"}</p>
              <p>Order: {label.orderNumber}</p>
              <p className={label.alert ? "mt-2 rounded-md bg-rose-100 p-2 font-semibold text-rose-800" : "mt-2"}>
                Allergy: {label.alert || "None"}
              </p>
            </>
          </div>
        ))}
      </div>
    </main>
  );
}
