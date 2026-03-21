import { createPdf, addHeader, addFooter, addInfoRow, savePdf, COLORS, MARGIN, CONTENT_WIDTH, PAGE_WIDTH } from "./pdfBase";

interface PaymentRow {
  id: number;
  student: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: "paid" | "pending" | "overdue";
}

interface PagosData {
  schoolName: string;
  payments: PaymentRow[];
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  collectionRate: string;
}

const statusLabels: Record<string, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  overdue: "Vencido",
};

export function generarReportePagos(data: PagosData): void {
  const doc = createPdf();
  const now = new Date();
  const monthYear = now.toLocaleString("es-PE", { month: "long", year: "numeric" }).replace(/^\w/, (c) => c.toUpperCase());

  let y = addHeader(doc, data.schoolName, "Reporte de Pagos", monthYear);

  // Summary row
  const summaryItems = [
    { label: "Recibidos", value: `S/ ${data.totalPaid.toLocaleString()}`, color: COLORS.success },
    { label: "Pendientes", value: `S/ ${data.totalPending.toLocaleString()}`, color: COLORS.warning },
    { label: "Vencidos", value: `S/ ${data.totalOverdue.toLocaleString()}`, color: COLORS.danger },
    { label: "Cobranza", value: `${data.collectionRate}%`, color: COLORS.primary },
  ];
  const cardW = CONTENT_WIDTH / summaryItems.length;
  summaryItems.forEach((item, i) => {
    const x = MARGIN + i * cardW;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, cardW - 3, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(item.label, x + (cardW - 3) / 2, y + 5, { align: "center" });
    doc.setFontSize(11);
    doc.setTextColor(...item.color);
    doc.text(item.value, x + (cardW - 3) / 2, y + 13, { align: "center" });
  });
  y += 24;

  // Payments table
  const rows = data.payments.map((p) => [
    p.student,
    p.grade,
    `S/ ${p.amount}`,
    p.dueDate,
    p.paidDate,
    statusLabels[p.status] || p.status,
  ]);

  doc.autoTable({
    startY: y,
    head: [["Estudiante", "Grado", "Monto", "Vencimiento", "Fecha Pago", "Estado"]],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
      textColor: COLORS.dark,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left" },
      1: { halign: "center" },
      2: { halign: "right" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(hookData: { section: string; column: { index: number }; cell: { styles: Record<string, unknown> }; row: { raw: unknown[] } }) {
      if (hookData.section === "body" && hookData.column.index === 5) {
        const status = String(hookData.row.raw[5]);
        if (status === "Pagado") hookData.cell.styles["textColor"] = COLORS.success;
        else if (status === "Pendiente") hookData.cell.styles["textColor"] = COLORS.warning;
        else hookData.cell.styles["textColor"] = COLORS.danger;
      }
    },
  });

  addFooter(doc, data.schoolName);
  savePdf(doc, `reporte_pagos_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`);
}

// Individual receipt PDF
interface ReciboData {
  schoolName: string;
  receiptId: number;
  student: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: string;
}

export function generarRecibo(data: ReciboData): void {
  const doc = createPdf();

  let y = addHeader(doc, data.schoolName, "Recibo de Pago", "Pensión Escolar");

  y += 4;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(MARGIN, y - 4, CONTENT_WIDTH, 48, 3, 3, "F");

  y += 2;
  y = addInfoRow(doc, "N° Recibo:", `REC-${String(data.receiptId).padStart(4, "0")}`, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Estudiante:", data.student, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Grado:", data.grade, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Concepto:", "Pensión Escolar", y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Vencimiento:", data.dueDate, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Fecha de Pago:", data.paidDate, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Estado:", statusLabels[data.status] || data.status, y, MARGIN + 5, 65);

  y += 8;

  // Amount box
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 18, 3, 3, "F");
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  doc.text("Monto Total", MARGIN + 8, y + 11);
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(`S/ ${data.amount}`, CONTENT_WIDTH + MARGIN - 8, y + 12, { align: "right" });

  y += 28;

  // Disclaimer
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Este recibo es un comprobante de pago emitido por ${data.schoolName}.`, PAGE_WIDTH / 2, y, { align: "center" });

  addFooter(doc, data.schoolName);
  savePdf(doc, `recibo_${String(data.receiptId).padStart(4, "0")}`);
}
