import { OrderStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateLabelsPdfBuffer, mapOrderToLabelRows } from "@/lib/pdf/labels";
import { assertAdminApiRequest } from "@/lib/admin-auth";
import { resolveDeliveryDateIds } from "@/lib/orders";

export async function GET(request: Request) {
  try {
    await assertAdminApiRequest();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const deliveryDate = searchParams.get("deliveryDate") ?? undefined;
  const schoolIds = searchParams.getAll("schoolIds").filter(Boolean);
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;
  const format = searchParams.get("format") ?? "pdf";
  const deliveryDateIds = await resolveDeliveryDateIds(deliveryDate);

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

  if (format === "json") {
    return NextResponse.json({ labels: mapOrderToLabelRows(orders) });
  }

  const buffer = await generateLabelsPdfBuffer(orders);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'inline; filename="student-labels.pdf"'
    }
  });
}
