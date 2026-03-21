import { jsPDF } from "jspdf";
import "jspdf-autotable";

// Extend jsPDF with autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: Record<string, unknown>) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

const COLORS = {
  primary: [37, 99, 235] as [number, number, number],     // #2563eb
  dark: [30, 41, 59] as [number, number, number],          // #1e293b
  muted: [100, 116, 139] as [number, number, number],      // #64748b
  light: [241, 245, 249] as [number, number, number],      // #f1f5f9
  border: [226, 232, 240] as [number, number, number],     // #e2e8f0
  success: [16, 185, 129] as [number, number, number],     // #10b981
  danger: [220, 38, 38] as [number, number, number],       // #dc2626
  warning: [245, 158, 11] as [number, number, number],     // #f59e0b
};

const MARGIN = 20;
const PAGE_WIDTH = 210; // A4
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export function createPdf(orientation: "portrait" | "landscape" = "portrait"): jsPDF {
  return new jsPDF({ orientation, unit: "mm", format: "a4" });
}

export function addHeader(doc: jsPDF, schoolName: string, title: string, subtitle?: string): number {
  let y = MARGIN;

  // School name
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.primary);
  doc.text(schoolName, PAGE_WIDTH / 2, y, { align: "center" });
  y += 8;

  // Title
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, PAGE_WIDTH / 2, y, { align: "center" });
  y += 6;

  // Subtitle
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.muted);
    doc.text(subtitle, PAGE_WIDTH / 2, y, { align: "center" });
    y += 5;
  }

  // Divider line
  y += 2;
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;

  return y;
}

export function addFooter(doc: jsPDF, schoolName: string): void {
  const pageCount = doc.getNumberOfPages();
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageHeight - 15, PAGE_WIDTH - MARGIN, pageHeight - 15);

    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`${schoolName} — Generado: ${dateStr}`, MARGIN, pageHeight - 10);
    doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN, pageHeight - 10, { align: "right" });
  }
}

export function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.dark);
  doc.text(title, MARGIN, y);
  y += 2;
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, y, MARGIN + doc.getTextWidth(title), y);
  return y + 6;
}

export function addLabelValue(doc: jsPDF, label: string, value: string, x: number, y: number): number {
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(label, x, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(value, x + doc.getTextWidth(label) + 2, y);
  return y + 5;
}

export function addInfoRow(doc: jsPDF, label: string, value: string, y: number, labelX = MARGIN, valueX = 70): number {
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(label, labelX, y);
  doc.setTextColor(...COLORS.dark);
  doc.text(value, valueX, y);
  return y + 6;
}

export function savePdf(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
}

export { COLORS, MARGIN, PAGE_WIDTH, CONTENT_WIDTH };
