import { useState, useEffect } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { studentsService } from "../services/students.service";

export interface StudentProfileData {
  name: string;
  avatar: string;
  code: string;
  grade: string;
  section: string;
  birthDate: string;
  address: string;
  parent: string;
  parentPhone: string;
  parentEmail: string;
  attendance: number;
  paymentStatus: "paid" | "pending" | "overdue";
  avgGrade: number;
  attendanceHistory: { month: string; percentage: number }[];
  gradesData: { subject: string; grade: number }[];
  paymentsHistory: { id: number; month: string; amount: string; status: "paid" | "pending" | "overdue"; date: string }[];
}

// ── Demo data ────────────────────────────────────────────────

const studentsMap: Record<string, StudentProfileData> = {
  "1": { name: "María González Pérez", avatar: "MG", code: "EST-2024-001", grade: "5° Primaria", section: "A", birthDate: "15/03/2015", address: "Av. Los Olivos 234, San Isidro", parent: "Carlos González Ruiz", parentPhone: "+51 987 654 321", parentEmail: "carlos.gonzalez@email.com", attendance: 96.5, paymentStatus: "paid", avgGrade: 17.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "2": { name: "Juan Pérez Rodríguez", avatar: "JP", code: "EST-2024-002", grade: "4° Primaria", section: "B", birthDate: "22/07/2016", address: "Jr. Las Flores 567, Miraflores", parent: "Ana Rodríguez", parentPhone: "+51 976 543 210", parentEmail: "ana.rodriguez@email.com", attendance: 94.2, paymentStatus: "paid", avgGrade: 16.5, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "3": { name: "Sofía Martínez López", avatar: "SM", code: "EST-2024-003", grade: "3° Secundaria", section: "A", birthDate: "10/11/2012", address: "Calle Los Pinos 890, Surco", parent: "Roberto Martínez", parentPhone: "+51 965 432 109", parentEmail: "roberto.martinez@email.com", attendance: 98.1, paymentStatus: "pending", avgGrade: 19.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "4": { name: "Diego Ramírez Silva", avatar: "DR", code: "EST-2024-004", grade: "2° Secundaria", section: "B", birthDate: "03/05/2013", address: "Av. Primavera 123, San Borja", parent: "Patricia Silva", parentPhone: "+51 954 321 098", parentEmail: "patricia.silva@email.com", attendance: 89.3, paymentStatus: "overdue", avgGrade: 14.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "5": { name: "Valentina Torres Castro", avatar: "VT", code: "EST-2024-005", grade: "4 años", section: "A", birthDate: "28/01/2022", address: "Jr. Los Cedros 456, La Molina", parent: "Luis Torres", parentPhone: "+51 943 210 987", parentEmail: "luis.torres@email.com", attendance: 97.8, paymentStatus: "paid", avgGrade: 17.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "6": { name: "Mateo Flores Ruiz", avatar: "MF", code: "EST-2024-006", grade: "1° Secundaria", section: "A", birthDate: "19/09/2014", address: "Av. Javier Prado 789, Magdalena", parent: "Carmen Flores", parentPhone: "+51 932 109 876", parentEmail: "carmen.flores@email.com", attendance: 91.5, paymentStatus: "paid", avgGrade: 15.5, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "7": { name: "Isabella Vargas Díaz", avatar: "IV", code: "EST-2024-007", grade: "5 años", section: "B", birthDate: "07/04/2021", address: "Calle Las Palmeras 321, Jesús María", parent: "Fernando Vargas", parentPhone: "+51 921 098 765", parentEmail: "fernando.vargas@email.com", attendance: 95.2, paymentStatus: "pending", avgGrade: 18.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
  "8": { name: "Santiago Morales Cruz", avatar: "SC", code: "EST-2024-008", grade: "3° Primaria", section: "A", birthDate: "14/12/2017", address: "Av. Brasil 654, Pueblo Libre", parent: "Elena Morales", parentPhone: "+51 910 987 654", parentEmail: "elena.morales@email.com", attendance: 93.7, paymentStatus: "paid", avgGrade: 16.0, attendanceHistory: [], gradesData: [], paymentsHistory: [] },
};

function generateAttendanceData(baseAttendance: number) {
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"];
  const offsets = [-1.5, -2.3, 0.5, -0.5, 1.5, 0, -2.0];
  return months.map((month, i) => ({
    month,
    percentage: Math.min(100, Math.max(75, Math.round((baseAttendance + offsets[i]) * 10) / 10)),
  }));
}

function generateGradesData(avgGrade: number) {
  const subjects = ["Matemáticas", "Comunicación", "Ciencias", "Historia", "Inglés"];
  const offsets = [1, -1, 0, -2, 2];
  return subjects.map((subject, i) => ({
    subject,
    grade: Math.min(20, Math.max(5, Math.round(avgGrade + offsets[i]))),
  }));
}

function generatePaymentsHistory(paymentStatus: "paid" | "pending" | "overdue") {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const fmtMonth = (offset: number) => {
    const d = new Date(y, m - offset, 1);
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };
  const fmtDate = (offset: number, day: number) => {
    const d = new Date(y, m - offset, day);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  if (paymentStatus === "paid") {
    return [
      { id: 1, month: fmtMonth(0), amount: "S/ 450", status: "paid" as const, date: fmtDate(0, 1) },
      { id: 2, month: fmtMonth(1), amount: "S/ 450", status: "paid" as const, date: fmtDate(1, 1) },
      { id: 3, month: fmtMonth(2), amount: "S/ 450", status: "paid" as const, date: fmtDate(2, 2) },
    ];
  }
  if (paymentStatus === "pending") {
    return [
      { id: 1, month: fmtMonth(0), amount: "S/ 450", status: "pending" as const, date: "—" },
      { id: 2, month: fmtMonth(1), amount: "S/ 450", status: "paid" as const, date: fmtDate(1, 3) },
      { id: 3, month: fmtMonth(2), amount: "S/ 450", status: "paid" as const, date: fmtDate(2, 2) },
    ];
  }
  // overdue
  return [
    { id: 1, month: fmtMonth(0), amount: "S/ 450", status: "overdue" as const, date: "—" },
    { id: 2, month: fmtMonth(1), amount: "S/ 450", status: "overdue" as const, date: "—" },
    { id: 3, month: fmtMonth(2), amount: "S/ 450", status: "paid" as const, date: fmtDate(2, 5) },
  ];
}

function getDemoStudent(id: string): StudentProfileData | null {
  const base = studentsMap[id];
  if (!base) return null;
  return {
    ...base,
    attendanceHistory: generateAttendanceData(base.attendance),
    gradesData: generateGradesData(base.avgGrade),
    paymentsHistory: generatePaymentsHistory(base.paymentStatus),
  };
}

// ── Supabase data fetching ───────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const MONTH_NAMES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const MONTH_NAMES_LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

async function fetchFromSupabase(numId: number): Promise<StudentProfileData | null> {
  if (!supabase) return null;

  const student = await studentsService.getById(numId);
  if (!student) return null;

  // Fetch grades, payments, and attendance in parallel
  const [gradesRes, paymentsRes, attendanceRes] = await Promise.all([
    supabase.from("grades").select("*, classes(subject)").eq("student_id", numId),
    supabase.from("payment_summary").select("*").eq("student_id", numId).order("due_date", { ascending: false }).limit(6),
    supabase.from("attendance").select("*").eq("student_id", numId),
  ]);

  // Process grades
  const gradesRows = gradesRes.data ?? [];
  const subjectGrades: Record<string, number[]> = {};
  for (const row of gradesRows) {
    const subject = (row as any).classes?.subject ?? "Sin materia";
    if (!subjectGrades[subject]) subjectGrades[subject] = [];
    subjectGrades[subject].push(row.average);
  }
  const gradesData = Object.entries(subjectGrades).map(([subject, grades]) => ({
    subject,
    grade: Math.round(grades.reduce((a, b) => a + b, 0) / grades.length * 10) / 10,
  }));
  const avgGrade = gradesData.length > 0
    ? Math.round(gradesData.reduce((sum, g) => sum + g.grade, 0) / gradesData.length * 10) / 10
    : 0;

  // Process payments
  const paymentRows = paymentsRes.data ?? [];
  const paymentsHistory = paymentRows.map((p, i) => {
    const dueDate = new Date(p.due_date);
    const monthLabel = `${MONTH_NAMES_LONG[dueDate.getMonth()]} ${dueDate.getFullYear()}`;
    const paidDate = p.paid_date ? new Date(p.paid_date).toLocaleDateString("es-PE") : "—";
    return {
      id: i + 1,
      month: monthLabel,
      amount: `S/ ${Number(p.amount).toLocaleString()}`,
      status: p.status as "paid" | "pending" | "overdue",
      date: paidDate,
    };
  });

  // Determine overall payment status from latest payment
  let paymentStatus: "paid" | "pending" | "overdue" = "paid";
  if (paymentRows.length > 0) {
    const latestStatuses = paymentRows.slice(0, 3).map((p) => p.status);
    if (latestStatuses.includes("overdue")) paymentStatus = "overdue";
    else if (latestStatuses.includes("pending")) paymentStatus = "pending";
  }

  // Process attendance
  const attendanceRows = attendanceRes.data ?? [];
  const monthlyData: Record<string, { total: number; present: number }> = {};
  for (const row of attendanceRows) {
    const d = new Date(row.date);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    if (!monthlyData[key]) monthlyData[key] = { total: 0, present: 0 };
    monthlyData[key].total++;
    if (row.status === "present" || row.status === "late") monthlyData[key].present++;
  }
  const sortedMonths = Object.keys(monthlyData).sort();
  const attendanceHistory = sortedMonths.map((key) => {
    const monthIdx = Number(key.split("-")[1]);
    return {
      month: MONTH_NAMES[monthIdx],
      percentage: Math.round((monthlyData[key].present / monthlyData[key].total) * 1000) / 10,
    };
  });

  // Overall attendance percentage
  const totalRecords = attendanceRows.length;
  const presentCount = attendanceRows.filter((r) => r.status === "present" || r.status === "late").length;
  const attendance = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 1000) / 10 : 0;

  return {
    name: student.name,
    avatar: getInitials(student.name),
    code: `EST-${student.id.toString().padStart(4, "0")}`,
    grade: student.grade,
    section: student.section,
    birthDate: "",
    address: student.address ?? "",
    parent: student.parent_name ?? "",
    parentPhone: student.parent_phone ?? "",
    parentEmail: student.parent_email ?? "",
    attendance,
    paymentStatus,
    avgGrade,
    attendanceHistory,
    gradesData,
    paymentsHistory,
  };
}

// ── Hook ─────────────────────────────────────────────────────

export function useStudentProfileData(id: string | undefined) {
  const [student, setStudent] = useState<StudentProfileData | null>(() => {
    if (!isSupabaseEnabled() && id) return getDemoStudent(id);
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState<boolean>(() => {
    if (!isSupabaseEnabled() && id) return !!studentsMap[id];
    return true;
  });

  useEffect(() => {
    if (!id) {
      setFound(false);
      return;
    }

    if (!isSupabaseEnabled()) {
      const demo = getDemoStudent(id);
      setStudent(demo);
      setFound(!!demo);
      return;
    }

    const numId = Number(id);
    if (isNaN(numId)) {
      setFound(false);
      return;
    }

    setLoading(true);
    setError(null);

    fetchFromSupabase(numId)
      .then((data) => {
        setStudent(data);
        setFound(!!data);
      })
      .catch(() => {
        setError("Error al cargar el perfil del estudiante. Verifica tu conexión.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  return { student, loading, error, found };
}
