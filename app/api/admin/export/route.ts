import { OrderStatus } from "@prisma/client";
import { Parser } from "json2csv";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { formatList } from "@/lib/utils";
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
      student: true,
      items: true,
      deliveryDate: true
    },
    orderBy: { createdAt: "asc" }
  });

  const rows = orders.map((order) => ({
    orderNumber: order.orderNumber,
    school: order.school.name,
    studentName: order.student.studentName,
    grade: order.student.grade,
    teacher: "",
    classroom: order.student.classroom ?? "",
    item: order.items.map((item) => item.itemNameSnapshot).join(", "),
    additions: formatList(order.items.flatMap((item) => item.additions)),
    removals: formatList(order.items.flatMap((item) => item.removals)),
    allergyNotes: order.items.map((item) => item.allergyNotes).find(Boolean) ?? "",
    specialInstructions: order.specialInstructions ?? "",
    totalPaid: (order.totalCents / 100).toFixed(2)
  }));

  const csv = new Parser().parse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="orders-export.csv"'
    }
  });
}
