import { Link } from "react-router";
import { Badge } from "../components/Badge";
import { useAuth } from "../contexts/AuthContext";
import { useParentData } from "../hooks/useParentData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { GraduationCap, TrendingUp, CreditCard, CheckCircle2, AlertCircle, Clock } from "lucide-react";

function getAttendanceColor(pct: number) {
  if (pct >= 95) return "text-[#10b981]";
  if (pct >= 90) return "text-[#f59e0b]";
  return "text-[#dc2626]";
}

function getGradeColor(grade: number) {
  if (grade >= 17) return "text-[#10b981]";
  if (grade >= 14) return "text-[#f59e0b]";
  return "text-[#dc2626]";
}

export function MisHijos() {
  const { user } = useAuth();
  const { children, loading, error } = useParentData(user?.email ?? "");

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Mis Hijos</h1>
        <p className="text-sm text-[#64748b]">Consulta el rendimiento académico y estado de pagos de tus hijos</p>
      </div>

      {error && (
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-4">
          <p className="text-sm text-[#dc2626]">{error}</p>
        </div>
      )}

      {children.length === 0 && !error ? (
        <div className="bg-white rounded-lg p-12 border border-border shadow-sm text-center">
          <GraduationCap className="w-12 h-12 text-[#cbd5e1] mx-auto mb-4" />
          <p className="text-[#64748b]">No se encontraron estudiantes vinculados a tu cuenta</p>
          <p className="text-sm text-[#94a3b8] mt-1">Contacta a la dirección del colegio para vincular a tus hijos</p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#eff6ff]"><GraduationCap className="w-5 h-5 text-[#2563eb]" /></div>
                <span className="text-sm text-[#64748b]">Hijos Matriculados</span>
              </div>
              <p className="text-3xl text-[#1e293b]">{children.length}</p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#dcfce7]"><TrendingUp className="w-5 h-5 text-[#10b981]" /></div>
                <span className="text-sm text-[#64748b]">Promedio General</span>
              </div>
              <p className="text-3xl text-[#1e293b]">
                {children.length > 0
                  ? (children.reduce((s, c) => s + c.avgGrade, 0) / children.length).toFixed(1)
                  : "—"}
              </p>
            </div>
            <div className="bg-white rounded-lg p-5 border border-border shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-[#fef3c7]"><CreditCard className="w-5 h-5 text-[#f59e0b]" /></div>
                <span className="text-sm text-[#64748b]">Pagos Pendientes</span>
              </div>
              <p className="text-3xl text-[#1e293b]">
                {children.filter((c) => c.paymentStatus !== "paid").length > 0
                  ? `S/ ${children.reduce((s, c) => s + c.pendingAmount, 0).toLocaleString()}`
                  : "Al día"}
              </p>
            </div>
          </div>

          {/* Children list */}
          <div className="space-y-4">
            {children.map((child) => (
              <Link
                key={child.id}
                to={`/mis-hijos/${child.id}`}
                className="block bg-white rounded-lg p-6 border border-border shadow-sm hover:shadow-md hover:border-[#2563eb]/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
                      <span className="text-lg text-[#2563eb]">{child.avatar}</span>
                    </div>
                    <div>
                      <h3 className="text-lg text-[#1e293b]">{child.name}</h3>
                      <p className="text-sm text-[#64748b]">{child.grade} — Sección {child.section}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs text-[#64748b] mb-1">Asistencia</p>
                      <p className={`text-lg font-medium ${getAttendanceColor(child.attendance)}`}>
                        {child.attendance}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#64748b] mb-1">Promedio</p>
                      <p className={`text-lg font-medium ${getGradeColor(child.avgGrade)}`}>
                        {child.avgGrade > 0 ? child.avgGrade.toFixed(1) : "—"}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#64748b] mb-1">Pagos</p>
                      {child.paymentStatus === "paid" && (
                        <Badge variant="success"><CheckCircle2 className="w-3 h-3 inline mr-1" />Al día</Badge>
                      )}
                      {child.paymentStatus === "pending" && (
                        <Badge variant="warning"><Clock className="w-3 h-3 inline mr-1" />Pendiente</Badge>
                      )}
                      {child.paymentStatus === "overdue" && (
                        <Badge variant="danger"><AlertCircle className="w-3 h-3 inline mr-1" />Vencido</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
