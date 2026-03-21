import { createPdf, addHeader, addFooter, savePdf, COLORS, MARGIN, CONTENT_WIDTH } from "./pdfBase";

interface ClassAttendanceRow {
  grade: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface AsistenciaData {
  schoolName: string;
  date: string;
  classes: ClassAttendanceRow[];
  totalStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  overallPercentage: string;
}

export function generarReporteAsistencia(data: AsistenciaData): void {
  const doc = createPdf();

  let y = addHeader(doc, data.schoolName, "Reporte de Asistencia", data.date);

  // Summary cards row
  const cards = [
    { label: "Total", value: String(data.totalStudents), color: COLORS.primary },
    { label: "Presentes", value: String(data.totalPresent), color: COLORS.success },
    { label: "Ausentes", value: String(data.totalAbsent), color: COLORS.danger },
    { label: "Tardanzas", value: String(data.totalLate), color: COLORS.warning },
    { label: "Asistencia", value: `${data.overallPercentage}%`, color: COLORS.primary },
  ];
  const cardW = CONTENT_WIDTH / cards.length;
  cards.forEach((card, i) => {
    const x = MARGIN + i * cardW;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, cardW - 3, 16, 2, 2, "F");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(card.label, x + (cardW - 3) / 2, y + 5, { align: "center" });
    doc.setFontSize(13);
    doc.setTextColor(...card.color);
    doc.text(card.value, x + (cardW - 3) / 2, y + 13, { align: "center" });
  });
  y += 24;

  // Table
  const rows = data.classes.map((c) => [
    c.grade,
    String(c.total),
    String(c.present),
    String(c.absent),
    String(c.late),
    `${c.percentage}%`,
  ]);

  doc.autoTable({
    startY: y,
    head: [["Clase", "Total", "Presentes", "Ausentes", "Tardanzas", "% Asistencia"]],
    body: rows,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 10,
      cellPadding: 4,
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
      2: { halign: "center" },
      3: { halign: "center" },
      4: { halign: "center" },
      5: { halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(hookData: { section: string; column: { index: number }; cell: { styles: Record<string, unknown> }; row: { raw: unknown[] } }) {
      if (hookData.section === "body" && hookData.column.index === 5) {
        const pct = parseFloat(String(hookData.row.raw[5]));
        if (pct >= 90) hookData.cell.styles["textColor"] = COLORS.success;
        else if (pct >= 75) hookData.cell.styles["textColor"] = COLORS.warning;
        else hookData.cell.styles["textColor"] = COLORS.danger;
      }
    },
  });

  addFooter(doc, data.schoolName);
  savePdf(doc, `asistencia_${data.date.replace(/\s+/g, "_").replace(/,/g, "")}`);
}
