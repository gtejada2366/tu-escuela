/**
 * CSV Import utility for bulk student creation.
 */
import { studentsService, type StudentInsert } from "../services/students.service";
import { isSupabaseEnabled } from "./supabase";

export interface CSVRow {
  nombre: string;
  grado: string;
  seccion: string;
  apoderado: string;
  telefono: string;
  email_apoderado: string;
  direccion: string;
}

export interface CSVParseResult {
  rows: CSVRow[];
  errors: { row: number; message: string }[];
}

export interface CSVImportResult {
  created: number;
  failed: number;
  errors: { row: number; name: string; message: string }[];
}

const EXPECTED_HEADERS = ["nombre", "grado", "seccion", "apoderado", "telefono", "email_apoderado", "direccion"];

function parseLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCSV(text: string): CSVParseResult {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) {
    return { rows: [], errors: [{ row: 1, message: "El archivo debe tener al menos un encabezado y una fila de datos" }] };
  }

  const rawHeaders = parseLine(lines[0]).map((h) =>
    h.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_")
  );

  // Map headers to expected column indices
  const colMap: Record<string, number> = {};
  for (const expected of EXPECTED_HEADERS) {
    const idx = rawHeaders.findIndex((h) => h.includes(expected) || expected.includes(h));
    if (idx !== -1) colMap[expected] = idx;
  }

  // At minimum we need nombre and grado
  if (colMap["nombre"] === undefined) {
    // Try positional fallback: nombre, grado, seccion, apoderado, telefono, email, direccion
    EXPECTED_HEADERS.forEach((h, i) => {
      if (i < rawHeaders.length) colMap[h] = i;
    });
  }

  const rows: CSVRow[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i]);
    const get = (key: string) => (colMap[key] !== undefined ? values[colMap[key]] ?? "" : "");

    const nombre = get("nombre");
    const grado = get("grado");
    const seccion = get("seccion");

    if (!nombre.trim()) {
      errors.push({ row: i + 1, message: "Nombre vacío" });
      continue;
    }
    if (!grado.trim()) {
      errors.push({ row: i + 1, message: `"${nombre}" — grado vacío` });
      continue;
    }

    rows.push({
      nombre: nombre.trim(),
      grado: grado.trim(),
      seccion: seccion.trim() || "A",
      apoderado: get("apoderado").trim(),
      telefono: get("telefono").trim(),
      email_apoderado: get("email_apoderado").trim(),
      direccion: get("direccion").trim(),
    });
  }

  return { rows, errors };
}

export async function importCSV(rows: CSVRow[]): Promise<CSVImportResult> {
  if (!isSupabaseEnabled()) {
    // Demo mode — simulate success
    return { created: rows.length, failed: 0, errors: [] };
  }

  let created = 0;
  let failed = 0;
  const errors: { row: number; name: string; message: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const insert: StudentInsert = {
      name: r.nombre,
      grade: r.grado,
      section: r.seccion,
      parent_name: r.apoderado || null,
      parent_phone: r.telefono || null,
      parent_email: r.email_apoderado || null,
      address: r.direccion || null,
      status: "active",
      academic_year_id: null,
    };

    const { error } = await studentsService.create(insert);
    if (error) {
      failed++;
      errors.push({ row: i + 1, name: r.nombre, message: error });
    } else {
      created++;
    }
  }

  return { created, failed, errors };
}

export function generateTemplateCSV(): string {
  const header = "nombre,grado,seccion,apoderado,telefono,email_apoderado,direccion";
  const example = '"María González Pérez","5° Primaria","A","Carlos González","+51 987 654 321","carlos@email.com","Av. Los Olivos 234"';
  return header + "\n" + example;
}
