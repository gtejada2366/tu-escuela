import { useState, useEffect } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { studentsService } from "../services/students.service";
import { classesService } from "../services/classes.service";
import { paymentsService } from "../services/payments.service";
import { authService } from "../services/auth.service";

export interface EnrollmentPoint {
  month: string;
  students: number;
}

export interface ActivityItem {
  id: number;
  text: string;
  time: string;
  iconName: string;
}

export interface AttendanceSummary {
  present: number;
  presentPct: string;
  absent: number;
  absentPct: string;
  late: number;
  latePct: string;
}

export interface PaymentSummary {
  received: string;
  pending: string;
  overdue: string;
  collectionRate: string;
}

export interface TeacherClass {
  id: number;
  name: string;
  schedule: string;
  classroom: string;
}

export interface DirectorStats {
  totalStudents: string;
  totalProfessors: string;
  activeClasses: string;
  attendanceToday: string;
  enrollment: EnrollmentPoint[];
  attendance: AttendanceSummary;
  payments: PaymentSummary;
  recentActivity: ActivityItem[];
}

export interface ProfesorStats {
  myClasses: string;
  myStudents: string;
  avgAttendance: string;
  pendingEvals: string;
  attendance: AttendanceSummary;
  recentActivity: ActivityItem[];
  todayClasses: TeacherClass[];
}

const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const emptyAttendance: AttendanceSummary = { present: 0, presentPct: "0%", absent: 0, absentPct: "0%", late: 0, latePct: "0%" };

const demoDirectorStats: DirectorStats = {
  totalStudents: "378",
  totalProfessors: "8",
  activeClasses: "7",
  attendanceToday: "94.2%",
  enrollment: [
    { month: "Ene", students: 245 },
    { month: "Feb", students: 268 },
    { month: "Mar", students: 289 },
    { month: "Abr", students: 312 },
    { month: "May", students: 334 },
    { month: "Jun", students: 356 },
    { month: "Jul", students: 378 },
  ],
  attendance: { present: 356, presentPct: "94.2%", absent: 15, absentPct: "4.0%", late: 7, latePct: "1.8%" },
  payments: { received: "S/ 168,750", pending: "S/ 34,200", overdue: "S/ 12,450", collectionRate: "78.3%" },
  recentActivity: [
    { id: 1, text: "María González fue matriculada en 5° Primaria A", time: "Hace 2 horas", iconName: "UserPlus" },
    { id: 2, text: "Pago recibido de Juan Pérez - S/ 450", time: "Hace 3 horas", iconName: "DollarSign" },
    { id: 3, text: "Prof. Carlos Mendoza registró notas de 3° Primaria", time: "Hace 5 horas", iconName: "CheckCircle2" },
    { id: 4, text: "Mensaje enviado a padres de 4 años Inicial", time: "Hace 6 horas", iconName: "CheckCircle2" },
  ],
};

const demoProfesorStats: ProfesorStats = {
  myClasses: "3",
  myStudents: "83",
  avgAttendance: "95.1%",
  pendingEvals: "2",
  attendance: { present: 79, presentPct: "95.2%", absent: 3, absentPct: "3.6%", late: 1, latePct: "1.2%" },
  recentActivity: [
    { id: 1, text: "Calificaciones de Semana 4 actualizadas", time: "Hace 1 hora", iconName: "CheckCircle2" },
    { id: 2, text: "Asistencia de hoy registrada", time: "Hace 3 horas", iconName: "ClipboardCheck" },
    { id: 3, text: "Nuevo mensaje de Ana Rodríguez (madre)", time: "Hace 5 horas", iconName: "CheckCircle2" },
  ],
  todayClasses: [],
};

function formatCurrency(n: number): string {
  return `S/ ${n.toLocaleString("es-PE")}`;
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
}

function computeAttendanceSummary(records: { status: string }[]): AttendanceSummary {
  const total = records.length;
  if (total === 0) return emptyAttendance;
  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const late = records.filter((r) => r.status === "late").length;
  const pct = (n: number) => `${total > 0 ? ((n / total) * 100).toFixed(1) : 0}%`;
  return { present, presentPct: pct(present), absent, absentPct: pct(absent), late, latePct: pct(late) };
}

export function useDashboardData() {
  const { isProfesor, user } = useAuth();
  const [directorStats, setDirectorStats] = useState<DirectorStats>(demoDirectorStats);
  const [profesorStats, setProfesorStats] = useState<ProfesorStats>(demoProfesorStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) return;
    setLoading(true);
    setError(null);
    const today = toISODate(new Date());

    if (!isProfesor) {
      // ── Director dashboard ─────────────────────────────────
      Promise.all([
        studentsService.count(),
        authService.getAllUsers(),
        classesService.getAll(),
        paymentsService.getSummaryStats(),
        // Attendance today (all classes)
        supabase.from("attendance").select("status").eq("date", today),
        // Enrollment trend: all active students with created_at
        supabase.from("students").select("created_at").eq("status", "active"),
        // Recent activity: recent paid payments
        supabase.from("payment_summary").select("student_name, amount, paid_date").eq("status", "paid").order("paid_date", { ascending: false }).limit(3),
        // Recent enrollments
        supabase.from("students").select("name, grade, created_at").order("created_at", { ascending: false }).limit(3),
      ]).then(([studentCount, profiles, classes, paymentStats, attResult, studentsResult, recentPaymentsResult, recentStudentsResult]) => {
        const professorCount = profiles.filter((p) => p.role === "profesor" && p.status === "active").length;
        const activeClasses = classes.filter((c) => c.status === "active").length;
        const totalPayments = paymentStats.paid + paymentStats.pending + paymentStats.overdue;
        const collectionRate = totalPayments > 0 ? ((paymentStats.paid / totalPayments) * 100).toFixed(1) : "0";

        // Attendance today
        const attRecords = attResult.data ?? [];
        const attSummary = computeAttendanceSummary(attRecords);
        const attTotal = attRecords.length;
        const presentCount = attRecords.filter((r) => r.status === "present").length;
        const attendancePct = attTotal > 0 ? ((presentCount / attTotal) * 100).toFixed(1) : "0";

        // Enrollment trend by month
        const enrollByMonth: Record<string, number> = {};
        for (const s of studentsResult.data ?? []) {
          const d = new Date(s.created_at);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          enrollByMonth[key] = (enrollByMonth[key] ?? 0) + 1;
        }
        // Build cumulative chart for current year
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        let cumulative = 0;
        const enrollment: EnrollmentPoint[] = [];
        for (let m = 0; m <= currentMonth; m++) {
          cumulative += enrollByMonth[`${currentYear}-${m}`] ?? 0;
          enrollment.push({ month: monthNames[m], students: cumulative });
        }
        // If no enrollment data, show total as flat line
        if (enrollment.length === 0 || cumulative === 0) {
          enrollment.length = 0;
          enrollment.push({ month: monthNames[currentMonth], students: studentCount });
        }

        // Recent activity from payments + enrollments
        const activity: ActivityItem[] = [];
        let actId = 1;
        for (const p of recentPaymentsResult.data ?? []) {
          activity.push({
            id: actId++,
            text: `Pago recibido de ${p.student_name} — S/ ${Number(p.amount).toLocaleString("es-PE")}`,
            time: p.paid_date ? timeAgo(p.paid_date) : "",
            iconName: "DollarSign",
          });
        }
        for (const s of recentStudentsResult.data ?? []) {
          activity.push({
            id: actId++,
            text: `${s.name} fue matriculado/a en ${s.grade}`,
            time: timeAgo(s.created_at),
            iconName: "UserPlus",
          });
        }
        // Sort by time (most recent first) — approximate by id since they're already sorted
        activity.sort((a, b) => a.time.localeCompare(b.time));

        setDirectorStats({
          totalStudents: String(studentCount),
          totalProfessors: String(professorCount),
          activeClasses: String(activeClasses),
          attendanceToday: `${attendancePct}%`,
          enrollment,
          attendance: attSummary,
          payments: {
            received: formatCurrency(paymentStats.paid),
            pending: formatCurrency(paymentStats.pending),
            overdue: formatCurrency(paymentStats.overdue),
            collectionRate: `${collectionRate}%`,
          },
          recentActivity: activity.slice(0, 5),
        });
        setLoading(false);
      }).catch(() => {
        setError("Error al cargar los datos. Verifica tu conexión.");
        setLoading(false);
      });
    } else {
      // ── Profesor dashboard ─────────────────────────────────
      if (!user?.uid) { setLoading(false); return; }
      classesService.getByTeacher(user.uid).then(async (classes) => {
        const totalStudents = classes.reduce((sum, c) => sum + (Number(c.student_count) || 0), 0);
        const classIds = classes.map((c) => c.id);

        // Today's attendance for teacher's classes
        let attSummary = emptyAttendance;
        let avgAttPct = "0%";
        if (classIds.length > 0 && supabase) {
          const { data: attRecords } = await supabase
            .from("attendance")
            .select("status")
            .in("class_id", classIds)
            .eq("date", today);
          if (attRecords && attRecords.length > 0) {
            attSummary = computeAttendanceSummary(attRecords);
            const presentCount = attRecords.filter((r) => r.status === "present").length;
            avgAttPct = `${((presentCount / attRecords.length) * 100).toFixed(1)}%`;
          }
        }

        // Pending evals: classes without any grades for current period
        let pendingEvals = 0;
        if (supabase && classIds.length > 0) {
          const { data: gradeRecords } = await supabase
            .from("grades")
            .select("class_id")
            .in("class_id", classIds);
          const classesWithGrades = new Set((gradeRecords ?? []).map((g) => g.class_id));
          pendingEvals = classIds.filter((id) => !classesWithGrades.has(id)).length;
        }

        // Teacher's classes for "Mis Clases Hoy"
        const todayClasses: TeacherClass[] = classes.map((c) => ({
          id: c.id,
          name: `${c.subject} - ${c.grade} ${c.section}`,
          schedule: c.schedule ?? "",
          classroom: c.classroom ?? "",
        }));

        // Recent activity from attendance
        const recentActivity: ActivityItem[] = [];
        if (supabase && classIds.length > 0) {
          const { data: recentAtt } = await supabase
            .from("attendance")
            .select("date, class_id")
            .in("class_id", classIds)
            .order("created_at", { ascending: false })
            .limit(1);
          if (recentAtt && recentAtt.length > 0) {
            const cls = classes.find((c) => c.id === recentAtt[0].class_id);
            recentActivity.push({
              id: 1,
              text: `Asistencia registrada para ${cls ? cls.subject + " " + cls.grade : "clase"}`,
              time: timeAgo(recentAtt[0].date),
              iconName: "ClipboardCheck",
            });
          }
          const { data: recentGrades } = await supabase
            .from("grades")
            .select("updated_at, class_id")
            .in("class_id", classIds)
            .order("updated_at", { ascending: false })
            .limit(1);
          if (recentGrades && recentGrades.length > 0) {
            const cls = classes.find((c) => c.id === recentGrades[0].class_id);
            recentActivity.push({
              id: 2,
              text: `Calificaciones actualizadas para ${cls ? cls.subject + " " + cls.grade : "clase"}`,
              time: timeAgo(recentGrades[0].updated_at),
              iconName: "CheckCircle2",
            });
          }
        }

        setProfesorStats({
          myClasses: String(classes.length),
          myStudents: String(totalStudents),
          avgAttendance: avgAttPct,
          pendingEvals: String(pendingEvals),
          attendance: attSummary,
          recentActivity,
          todayClasses,
        });
        setLoading(false);
      }).catch(() => {
        setError("Error al cargar los datos. Verifica tu conexión.");
        setLoading(false);
      });
    }
  }, [isProfesor, user]);

  return { directorStats, profesorStats, loading, error };
}
