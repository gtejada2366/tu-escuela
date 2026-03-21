import { createPdf, addHeader, addFooter, addSectionTitle, savePdf, COLORS, MARGIN, CONTENT_WIDTH } from "./pdfBase";
import type { GradeColumnConfig, GradeStudent } from "../../hooks/useGradesData";

interface CalificacionesData {
  schoolName: string;
  className: string;
  gradeConfig: GradeColumnConfig[];
  students: GradeStudent[];
  courseStats: { average: number; highest: number; lowest: number };
}

export function generarReporteCalificaciones(data: CalificacionesData): void {
  const doc = createPdf("landscape");
  const pageW = 297; // A4 landscape
  const margin = 15;

  let y = 15;

  // Header
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.schoolName, pageW / 2, y, { align: "center" });
  y += 7;
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.dark);
  doc.text("Reporte de Calificaciones", pageW / 2, y, { align: "center" });
  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${data.className} | Generado: ${new Date().toLocaleDateString("es-PE")}`, pageW / 2, y, { align: "center" });
  y += 4;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // Stats row
  const stats = [
    { label: "Promedio", value: String(data.courseStats.average), color: COLORS.primary },
    { label: "Más Alta", value: String(data.courseStats.highest), color: COLORS.success },
    { label: "Más Baja", value: String(data.courseStats.lowest), color: COLORS.danger },
    { label: "Estudiantes", value: String(data.students.length), color: COLORS.muted },
  ];
  const statWidth = (pageW - margin * 2) / stats.length;
  stats.forEach((stat, i) => {
    const x = margin + i * statWidth;
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(x, y, statWidth - 4, 14, 2, 2, "F");
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(stat.label, x + (statWidth - 4) / 2, y + 5, { align: "center" });
    doc.setFontSize(14);
    doc.setTextColor(...stat.color);
    doc.text(stat.value, x + (statWidth - 4) / 2, y + 11, { align: "center" });
  });
  y += 20;

  // Grades table
  const columns = [
    { header: "#", dataKey: "num" },
    { header: "Estudiante", dataKey: "name" },
    ...data.gradeConfig.map((c, i) => ({ header: c.label, dataKey: `col_${i}` })),
    { header: "Promedio", dataKey: "average" },
  ];

  const rows = data.students.map((s, idx) => {
    const row: Record<string, string | number> = { num: idx + 1, name: s.name, average: s.average };
    s.values.forEach((v, i) => { row[`col_${i}`] = v; });
    return row;
  });

  doc.autoTable({
    startY: y,
    columns,
    body: rows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 3,
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
      num: { halign: "center", cellWidth: 10 },
      name: { cellWidth: 50 },
      average: { halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell(hookData: { section: string; column: { dataKey: string }; cell: { styles: Record<string, unknown> }; row: { raw: Record<string, unknown> } }) {
      if (hookData.section === "body" && hookData.column.dataKey === "average") {
        const avg = Number(hookData.row.raw["average"]);
        if (avg >= 17) hookData.cell.styles["textColor"] = COLORS.success;
        else if (avg >= 14) hookData.cell.styles["textColor"] = COLORS.warning;
        else hookData.cell.styles["textColor"] = COLORS.danger;
      }
    },
  });

  addFooter(doc, data.schoolName);
  savePdf(doc, `calificaciones_${data.className.replace(/\s+/g, "_")}`);
}

// Libreta individual (per-student grade report)
interface LibretaData {
  schoolName: string;
  studentName: string;
  grade: string;
  section: string;
  gradesData: { subject: string; grade: number }[];
  avgGrade: number;
  attendance: number;
}

export function generarLibreta(data: LibretaData): void {
  const doc = createPdf();
  const currentYear = new Date().getFullYear();

  let y = addHeader(doc, data.schoolName, "Libreta de Notas", `Año Escolar ${currentYear}`);

  // Student info
  y = addSectionTitle(doc, "Datos del Estudiante", y);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text("Nombre:", MARGIN, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(data.studentName, 55, y);
  y += 6;
  doc.setTextColor(...COLORS.muted);
  doc.text("Grado:", MARGIN, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(`${data.grade} — Sección ${data.section}`, 55, y);
  y += 6;
  doc.setTextColor(...COLORS.muted);
  doc.text("Asistencia:", MARGIN, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(`${data.attendance}%`, 55, y);
  y += 10;

  // Grades table
  y = addSectionTitle(doc, "Calificaciones por Área", y);

  const gradeRows = data.gradesData.map((g) => [g.subject, String(g.grade)]);

  doc.autoTable({
    startY: y,
    head: [["Área Curricular", "Nota"]],
    body: gradeRows,
    margin: { left: MARGIN, right: MARGIN },
    styles: {
      fontSize: 11,
      cellPadding: 5,
      textColor: COLORS.dark,
      lineColor: COLORS.border,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: COLORS.primary,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: CONTENT_WIDTH * 0.7 },
      1: { cellWidth: CONTENT_WIDTH * 0.3, halign: "center", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didParseCell(hookData: { section: string; column: { index: number }; cell: { styles: Record<string, unknown> }; row: { raw: unknown[] } }) {
      if (hookData.section === "body" && hookData.column.index === 1) {
        const grade = Number(hookData.row.raw[1]);
        if (grade >= 17) hookData.cell.styles["textColor"] = COLORS.success;
        else if (grade >= 14) hookData.cell.styles["textColor"] = COLORS.warning;
        else hookData.cell.styles["textColor"] = COLORS.danger;
      }
    },
  });

  // Average summary
  const finalY = doc.lastAutoTable.finalY + 6;
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(MARGIN, finalY, CONTENT_WIDTH, 14, 3, 3, "F");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.muted);
  doc.text("Promedio General", MARGIN + 8, finalY + 9);
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.primary);
  doc.text(data.avgGrade.toFixed(1), CONTENT_WIDTH + MARGIN - 8, finalY + 9, { align: "right" });

  addFooter(doc, data.schoolName);
  savePdf(doc, `libreta_${data.studentName.replace(/\s+/g, "_")}`);
}
