import { useState, useEffect } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
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
}

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
};

function formatCurrency(n: number): string {
  return `S/ ${n.toLocaleString("es-PE")}`;
}

export function useDashboardData() {
  const { isProfesor, user } = useAuth();
  const [directorStats, setDirectorStats] = useState<DirectorStats>(demoDirectorStats);
  const [profesorStats, setProfesorStats] = useState<ProfesorStats>(demoProfesorStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    setError(null);

    if (!isProfesor) {
      // Director dashboard: aggregate from services
      Promise.all([
        studentsService.count(),
        authService.getAllUsers(),
        classesService.getAll(),
        paymentsService.getSummaryStats(),
      ]).then(([studentCount, profiles, classes, paymentStats]) => {
        const professorCount = profiles.filter((p) => p.role === "profesor" && p.status === "active").length;
        const activeClasses = classes.filter((c) => c.status === "active").length;
        const totalPayments = paymentStats.paid + paymentStats.pending + paymentStats.overdue;
        const collectionRate = totalPayments > 0 ? ((paymentStats.paid / totalPayments) * 100).toFixed(1) : "0";

        setDirectorStats((prev) => ({
          ...prev,
          totalStudents: String(studentCount),
          totalProfessors: String(professorCount),
          activeClasses: String(activeClasses),
          payments: {
            received: formatCurrency(paymentStats.paid),
            pending: formatCurrency(paymentStats.pending),
            overdue: formatCurrency(paymentStats.overdue),
            collectionRate: `${collectionRate}%`,
          },
        }));
        setLoading(false);
      }).catch(() => {
        setError("Error al cargar los datos. Verifica tu conexión.");
        setLoading(false);
      });
    } else {
      // Profesor dashboard: get their classes
      if (!user?.uid) { setLoading(false); return; }
      classesService.getByTeacher(user.uid).then((classes) => {
        const totalStudents = classes.reduce((sum, c) => sum + (c.student_count ?? 0), 0);
        setProfesorStats((prev) => ({
          ...prev,
          myClasses: String(classes.length),
          myStudents: String(totalStudents),
        }));
        setLoading(false);
      }).catch(() => {
        setError("Error al cargar los datos. Verifica tu conexión.");
        setLoading(false);
      });
    }
  }, [isProfesor, user]);

  return { directorStats, profesorStats, loading, error };
}
