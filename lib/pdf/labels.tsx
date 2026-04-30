import React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { Order, OrderItem, School, Student, DeliveryDate } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";

type LabelOrder = Order & {
  school: School;
  student: Student;
  deliveryDate: DeliveryDate;
  items: OrderItem[];
};

// A4 = 595.28 x 841.89pt. Labels are 4"x2" = 288x144pt, 2-up per row, 5 rows = 10 labels/page.
// Horizontal padding = (595.28 - 2*288) / 2 ≈ 9.6pt — labels sit flush edge-to-edge.
const LABEL_W = 288; // 4 inches
const LABEL_H = 144; // 2 inches
const H_PAD = 9.6;

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    paddingBottom: 4,
    fontFamily: "Helvetica"
  },
  pageTitle: {
    fontSize: 8,
    color: "#888",
    marginBottom: 4,
    textAlign: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  label: {
    width: LABEL_W,
    height: LABEL_H,
    border: "1 solid #d0d7de",
    borderRadius: 4,
    padding: 7,
    overflow: "hidden"
  },
  studentName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1
  },
  meta: {
    fontSize: 7.5,
    color: "#444",
    marginBottom: 1
  },
  itemSection: {
    marginTop: 5
  },
  itemName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1
  },
  customization: {
    fontSize: 7,
    color: "#333",
    marginBottom: 1
  },
  orderNum: {
    fontSize: 6.5,
    color: "#999",
    marginTop: 4
  },
  alert: {
    marginTop: 4,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderRadius: 3,
    backgroundColor: "#fde7e7",
    color: "#7a271a",
    fontSize: 7
  }
});

function LabelCard({ order }: { order: LabelOrder }) {
  const allergy = order.items.map((item) => item.allergyNotes).find(Boolean) || order.student.allergyNotes;
  const itemLines = order.items.map((item) => ({
    name: item.itemNameSnapshot,
    additions: item.additions.length ? item.additions.join(", ") : null,
    removals: item.removals.length ? item.removals.join(", ") : null
  }));

  return (
    <View style={styles.label}>
      <Text style={styles.studentName}>{order.student.studentName}</Text>
      <Text style={styles.meta}>
        Grade {order.student.grade}{order.student.classroom ? ` · Room ${order.student.classroom}` : ""} · {order.school.name}
      </Text>

      {itemLines.map((item, index) => (
        <View key={`${order.id}-${index}`} style={styles.itemSection}>
          <Text style={styles.itemName}>{item.name}</Text>
          {item.additions && <Text style={styles.customization}>+ {item.additions}</Text>}
          {item.removals && <Text style={styles.customization}>No: {item.removals}</Text>}
        </View>
      ))}

      {allergy ? <Text style={styles.alert}>⚠ {allergy}</Text> : null}
      <Text style={styles.orderNum}>{order.orderNumber}</Text>
    </View>
  );
}

function LabelsDocument({ orders }: { orders: LabelOrder[] }) {
  const titleDate =
    orders[0] &&
    formatInTimeZone(orders[0].deliveryDate.deliveryDate, orders[0].school.timezone, "EEEE, MMM d");

  return (
    <Document title={`Labels ${titleDate ?? ""}`}>
      <Page size="A4" style={styles.page}>
        {titleDate && <Text style={styles.pageTitle}>Student labels — {titleDate}</Text>}
        <View style={styles.grid}>
          {orders.map((order) => (
            <LabelCard key={order.id} order={order} />
          ))}
        </View>
      </Page>
    </Document>
  );
}

export async function generateLabelsPdfBuffer(orders: LabelOrder[]) {
  return renderToBuffer(<LabelsDocument orders={orders} />);
}

export function mapOrderToLabelRows(orders: LabelOrder[]) {
  return orders.map((order) => {
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      studentName: order.student.studentName,
      grade: order.student.grade,
      school: order.school.name,
      teacher: order.student.teacherName ?? "",
      classroom: order.student.classroom ?? "",
      itemName: order.items.map((item) => item.itemNameSnapshot).join(" | "),
      additions: order.items.flatMap((item) => item.additions),
      removals: order.items.flatMap((item) => item.removals),
      alert: order.items.map((item) => item.allergyNotes).find(Boolean) ?? order.student.allergyNotes ?? ""
    };
  });
}
