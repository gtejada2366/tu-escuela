import { createPdf, addHeader, addFooter, addInfoRow, savePdf, formatDate, MARGIN, PAGE_WIDTH } from "./pdfBase";

interface ConstanciaData {
  schoolName: string;
  studentName: string;
  code: string;
  grade: string;
  section: string;
  birthDate?: string;
  address?: string;
  parent?: string;
  parentPhone?: string;
  attendance: number;
}

export function generarConstancia(data: ConstanciaData): void {
  const doc = createPdf();
  const currentYear = new Date().getFullYear();

  let y = addHeader(doc, data.schoolName, "Constancia de Matrícula", `Año Escolar ${currentYear}`);

  // Date
  y += 4;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Lima, ${formatDate()}`, PAGE_WIDTH - MARGIN, y, { align: "right" });
  y += 10;

  // Body text
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const intro = `Por medio de la presente, la dirección de ${data.schoolName} hace constar que:`;
  doc.text(intro, MARGIN, y, { maxWidth: 170 });
  y += 12;

  // Student info box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(MARGIN, y - 4, 170, 50, 3, 3, "F");

  y += 2;
  y = addInfoRow(doc, "Nombre completo:", data.studentName, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Código:", data.code, y, MARGIN + 5, 65);
  y = addInfoRow(doc, "Grado:", `${data.grade} — Sección ${data.section}`, y, MARGIN + 5, 65);
  if (data.birthDate) {
    y = addInfoRow(doc, "F. Nacimiento:", data.birthDate, y, MARGIN + 5, 65);
  }
  if (data.address) {
    y = addInfoRow(doc, "Dirección:", data.address, y, MARGIN + 5, 65);
  }

  y += 8;

  // Enrollment statement
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const body = `Se encuentra debidamente matriculado(a) en nuestra institución educativa para el año escolar ${currentYear}, cursando el grado de ${data.grade}, Sección ${data.section}.`;
  const lines = doc.splitTextToSize(body, 170);
  doc.text(lines, MARGIN, y);
  y += lines.length * 6 + 4;

  // Attendance
  const attendanceText = `El/La estudiante registra una asistencia del ${data.attendance}% a la fecha.`;
  doc.text(attendanceText, MARGIN, y);
  y += 10;

  // Guardian info
  if (data.parent) {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(10);
    doc.text("Datos del Apoderado:", MARGIN, y);
    y += 6;
    y = addInfoRow(doc, "Nombre:", data.parent, y, MARGIN + 5, 65);
    if (data.parentPhone) {
      y = addInfoRow(doc, "Teléfono:", data.parentPhone, y, MARGIN + 5, 65);
    }
    y += 4;
  }

  // Closing
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("Se expide la presente constancia a solicitud del interesado(a) para los fines que estime conveniente.", MARGIN, y, { maxWidth: 170 });
  y += 20;

  // Signature line
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  const sigX = PAGE_WIDTH / 2;
  doc.line(sigX - 35, y, sigX + 35, y);
  y += 5;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Dirección", sigX, y, { align: "center" });
  y += 5;
  doc.text(data.schoolName, sigX, y, { align: "center" });

  addFooter(doc, data.schoolName);
  savePdf(doc, `constancia_${data.studentName.replace(/\s+/g, "_")}`);
}
