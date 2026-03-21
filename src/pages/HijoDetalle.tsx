import { useParams, Link } from "react-router";
import { Badge } from "../components/Badge";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useStudentProfileData } from "../hooks/useStudentProfileData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { generarConstancia } from "../lib/pdf/reporteConstancia";
import { generarLibreta } from "../lib/pdf/reporteCalificaciones";

function getAttendanceCounts(baseAttendance: number) {
  const totalDays = 142;
  const present = Math.round(totalDays * baseAttendance / 100);
  const late = Math.max(0, Math.round((100 - baseAttendance) / 3));
  const absent = Math.max(0, totalDays - present - late);
  return { present, absent, late };
}

function getPaymentBadge(status: "paid" | "pending" | "overdue") {
  if (status === "paid") return <Badge variant="success">Pagado</Badge>;
  if (status === "pending") return <Badge variant="warning">Pendiente</Badge>;
  return <Badge variant="danger">Vencido</Badge>;
}

function getPaymentTotal(payments: { status: string; amount: string }[]) {
  const total = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => {
      const num = parseFloat(p.amount.replace(/[^\d.]/g, ""));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);
  return `S/ ${total.toLocaleString("es-PE")}`;
}

export function HijoDetalle() {
  const { id } = useParams();
  const { student, loading, error, found } = useStudentProfileData(id);
  const { schoolName } = useSchoolConfig();

  if (loading) return <LoadingSpinner />;

  if (!found || !student) {
    return (
      <div className="space-y-6">
        <Link to="/mis-hijos" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Link>
        <div className="bg-white rounded-lg p-12 border border-border shadow-sm text-center">
          <p className="text-lg text-[#1e293b] mb-2">Estudiante no encontrado</p>
          <p className="text-sm text-[#64748b]">{error || "No se pudo cargar la información."}</p>
        </div>
      </div>
    );
  }

  const attendanceData = student.attendanceHistory.length > 0
    ? student.attendanceHistory
    : [{ month: "—", percentage: student.attendance }];
  const gradesData = student.gradesData;
  const paymentsHistory = student.paymentsHistory;
  const counts = getAttendanceCounts(student.attendance);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/mis-hijos" className="p-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#64748b]" />
          </Link>
          <div>
            <h1 className="text-2xl text-[#1e293b] mb-1">{student.name}</h1>
            <p className="text-sm text-[#64748b]">{student.grade} — Sección {student.section}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => generarConstancia({ schoolName, studentName: student.name, code: student.code, grade: student.grade, section: student.section, birthDate: student.birthDate, address: student.address, parent: student.parent, parentPhone: student.parentPhone, attendance: student.attendance })}
            className="flex items-center gap-2 px-3 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
          >
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">Constancia</span>
          </button>
          {gradesData.length > 0 && (
            <button
              onClick={() => generarLibreta({ schoolName, studentName: student.name, grade: student.grade, section: student.section, gradesData, avgGrade: student.avgGrade, attendance: student.attendance })}
              className="flex items-center gap-2 px-3 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
            >
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Libreta</span>
            </button>
          )}
        </div>
      </div>

      {/* Student info card */}
      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-full bg-[#eff6ff] flex items-center justify-center">
              <span className="text-2xl text-[#2563eb]">{student.avatar}</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#64748b]">Código:</span>
              <span className="text-sm text-[#1e293b]">{student.code}</span>
            </div>
            {student.birthDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#64748b]" />
                <span className="text-sm text-[#64748b]">Nacimiento:</span>
                <span className="text-sm text-[#1e293b]">{student.birthDate}</span>
              </div>
            )}
            <div className="p-3 rounded-lg bg-[#eff6ff] text-center">
              <p className="text-xs text-[#64748b]">Asistencia</p>
              <p className="text-xl text-[#2563eb]">{student.attendance}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Historial de Asistencia</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} domain={[85, 100]} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-[#d1fae5] text-center">
              <CheckCircle2 className="w-4 h-4 text-[#065f46] mx-auto mb-1" />
              <p className="text-xs text-[#065f46]">Presentes</p>
              <p className="text-lg text-[#065f46]">{counts.present}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#fee2e2] text-center">
              <XCircle className="w-4 h-4 text-[#991b1b] mx-auto mb-1" />
              <p className="text-xs text-[#991b1b]">Ausentes</p>
              <p className="text-lg text-[#991b1b]">{counts.absent}</p>
            </div>
            <div className="p-3 rounded-lg bg-[#fef3c7] text-center">
              <Clock className="w-4 h-4 text-[#92400e] mx-auto mb-1" />
              <p className="text-xs text-[#92400e]">Tardanzas</p>
              <p className="text-lg text-[#92400e]">{counts.late}</p>
            </div>
          </div>
        </div>

        {/* Payments */}
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Estado de Pagos</h3>
          {paymentsHistory.length > 0 ? (
            <div className="space-y-3">
              {paymentsHistory.map((payment) => (
                <div key={payment.id} className="pb-3 border-b border-border last:border-0 last:pb-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-[#1e293b]">{payment.month}</span>
                    {getPaymentBadge(payment.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#64748b]">{payment.date}</span>
                    <span className="text-sm text-[#1e293b]">{payment.amount}</span>
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748b]">Total Pagado {new Date().getFullYear()}</span>
                  <span className="text-lg text-[#1e293b]">{getPaymentTotal(paymentsHistory)}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#64748b]">Sin registros de pago</p>
          )}
        </div>
      </div>

      {/* Grades */}
      {gradesData.length > 0 && (
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Calificaciones</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={gradesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="subject" stroke="#64748b" style={{ fontSize: "12px" }} />
              <YAxis stroke="#64748b" style={{ fontSize: "12px" }} domain={[0, 20]} />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px" }} />
              <Bar dataKey="grade" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {gradesData.map((item) => (
              <div key={item.subject} className="p-3 rounded-lg border border-border text-center">
                <p className="text-xs text-[#64748b] mb-1">{item.subject}</p>
                <p className="text-xl text-[#1e293b]">{item.grade}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 rounded-lg bg-[#eff6ff]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Promedio General</span>
              <span className="text-xl text-[#2563eb]">{student.avgGrade.toFixed(1)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
