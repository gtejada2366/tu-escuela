import { useEffect } from "react";
import { Link } from "react-router";
import { MetricCard } from "../components/MetricCard";
import { useAuth } from "../contexts/AuthContext";
import {
  Users,
  GraduationCap,
  BookOpen,
  TrendingUp,
  UserPlus,
  DollarSign,
  UserCheck,
  UserX,
  Clock,
  CheckCircle2,
  CreditCard,
  ClipboardCheck,
  PlusCircle,
  CalendarDays,
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboardData, type ActivityItem } from "../hooks/useDashboardData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";


const iconMap: Record<string, typeof UserPlus> = {
  UserPlus, DollarSign, CheckCircle2, ClipboardCheck,
};

function ActivityList({ items }: { items: ActivityItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((activity) => {
        const Icon = iconMap[activity.iconName] ?? CheckCircle2;
        return (
          <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
            <div className="p-2 rounded-lg bg-[#eff6ff] shrink-0">
              <Icon className="w-4 h-4 text-[#2563eb]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#1e293b]">{activity.text}</p>
              <p className="text-xs text-[#64748b] mt-1">{activity.time}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DirectorDashboard({ stats }: { stats: ReturnType<typeof useDashboardData>["directorStats"] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Dashboard</h1>
        <p className="text-sm text-[#64748b]">Bienvenido al panel de administración</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Estudiantes"
          value={stats.totalStudents}
          icon={Users}
          change={stats.newStudentsThisMonth > 0 ? `+${stats.newStudentsThisMonth} este mes` : "Sin nuevos este mes"}
          changeType={stats.newStudentsThisMonth > 0 ? "positive" : "neutral"}
        />
        <MetricCard title="Total Profesores" value={stats.totalProfessors} icon={GraduationCap} change="Activos" changeType="neutral" />
        <MetricCard title="Clases Activas" value={stats.activeClasses} icon={BookOpen} change="En curso" changeType="neutral" />
        <MetricCard
          title="Asistencia Hoy"
          value={stats.attendanceToday}
          icon={TrendingUp}
          change={stats.attendanceDelta !== null
            ? `${stats.attendanceDelta >= 0 ? "+" : ""}${stats.attendanceDelta}% vs ayer`
            : "Sin datos de ayer"}
          changeType={stats.attendanceDelta !== null
            ? (stats.attendanceDelta >= 0 ? "positive" : "negative")
            : "neutral"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="mb-6">
            <h3 className="text-lg text-[#1e293b] mb-1">Crecimiento de Estudiantes</h3>
            <p className="text-sm text-[#64748b]">Nuevas matrículas por mes - {new Date().getFullYear()}</p>
          </div>
          <div className="w-full min-h-[280px]">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.enrollment}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="students" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Asistencia Hoy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#d1fae5]">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#065f46]" />
                <div>
                  <p className="text-sm text-[#065f46]">Presentes</p>
                  <p className="text-xl text-[#065f46]">{stats.attendance.present}</p>
                </div>
              </div>
              <span className="text-sm text-[#065f46]">{stats.attendance.presentPct}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-[#fee2e2]">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-[#991b1b]" />
                <div>
                  <p className="text-sm text-[#991b1b]">Ausentes</p>
                  <p className="text-xl text-[#991b1b]">{stats.attendance.absent}</p>
                </div>
              </div>
              <span className="text-sm text-[#991b1b]">{stats.attendance.absentPct}</span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-[#fef3c7]">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#92400e]" />
                <div>
                  <p className="text-sm text-[#92400e]">Tardanzas</p>
                  <p className="text-xl text-[#92400e]">{stats.attendance.late}</p>
                </div>
              </div>
              <span className="text-sm text-[#92400e]">{stats.attendance.latePct}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Estado de Pagos - {new Date().toLocaleString("es-PE", { month: "long" }).replace(/^\w/, c => c.toUpperCase())}</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-[#64748b]">Pagos Recibidos</span>
              <span className="text-sm text-[#1e293b]">{stats.payments.received}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm text-[#64748b]">Pagos Pendientes</span>
              <span className="text-sm text-[#f59e0b]">{stats.payments.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748b]">Pagos Vencidos</span>
              <span className="text-sm text-[#dc2626]">{stats.payments.overdue}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#64748b]">Tasa de Cobranza</span>
              <span className="text-sm text-[#10b981]">{stats.payments.collectionRate}</span>
            </div>
            <div className="w-full h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
              <div className="h-full bg-[#10b981] rounded-full" style={{ width: stats.payments.collectionRate }}></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Actividad Reciente</h3>
          <ActivityList items={stats.recentActivity} />
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-lg text-[#1e293b] mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/pagos" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
            <CreditCard className="w-6 h-6 text-[#2563eb]" />
            <span className="text-sm text-[#1e293b]">Registrar Pago</span>
          </Link>
          <Link to="/asistencia" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
            <ClipboardCheck className="w-6 h-6 text-[#2563eb]" />
            <span className="text-sm text-[#1e293b]">Tomar Asistencia</span>
          </Link>
          <Link to="/estudiantes" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
            <UserPlus className="w-6 h-6 text-[#2563eb]" />
            <span className="text-sm text-[#1e293b]">Agregar Estudiante</span>
          </Link>
          <Link to="/clases" className="flex flex-col items-center gap-2 p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
            <PlusCircle className="w-6 h-6 text-[#2563eb]" />
            <span className="text-sm text-[#1e293b]">Nueva Clase</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProfesorDashboard({ userName, stats }: { userName: string; stats: ReturnType<typeof useDashboardData>["profesorStats"] }) {
  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Bienvenido, {firstName}</h1>
        <p className="text-sm text-[#64748b]">Resumen de tu actividad docente</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Mis Clases" value={stats.myClasses} icon={BookOpen} change="Activas" changeType="neutral" />
        <MetricCard title="Mis Estudiantes" value={stats.myStudents} icon={Users} change="En total" changeType="neutral" />
        <MetricCard
          title="Asistencia Hoy"
          value={stats.avgAttendance}
          icon={TrendingUp}
          change={stats.attendanceDelta !== null
            ? `${stats.attendanceDelta >= 0 ? "+" : ""}${stats.attendanceDelta}% vs ayer`
            : "Sin datos de ayer"}
          changeType={stats.attendanceDelta !== null
            ? (stats.attendanceDelta >= 0 ? "positive" : "negative")
            : "neutral"}
        />
        <MetricCard
          title="Evaluaciones Pendientes"
          value={stats.pendingEvals}
          icon={CalendarDays}
          change={Number(stats.pendingEvals) > 0 ? "Clases sin notas" : "Al día"}
          changeType={Number(stats.pendingEvals) > 0 ? "negative" : "positive"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Mis Clases</h3>
          <div className="space-y-3">
            {stats.todayClasses.length > 0 ? stats.todayClasses.map((cls) => (
              <Link key={cls.id} to="/clases" className="flex items-center justify-between p-4 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] transition-colors">
                <div>
                  <p className="text-sm text-[#1e293b]">{cls.name}</p>
                  <p className="text-xs text-[#64748b]">{[cls.schedule, cls.classroom].filter(Boolean).join(" · ") || "Sin horario asignado"}</p>
                </div>
              </Link>
            )) : (
              <p className="text-sm text-[#64748b] py-4 text-center">No tienes clases asignadas</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Asistencia de Hoy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#d1fae5]">
              <div className="flex items-center gap-3">
                <UserCheck className="w-5 h-5 text-[#065f46]" />
                <div>
                  <p className="text-sm text-[#065f46]">Presentes</p>
                  <p className="text-xl text-[#065f46]">{stats.attendance.present}</p>
                </div>
              </div>
              <span className="text-sm text-[#065f46]">{stats.attendance.presentPct}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#fee2e2]">
              <div className="flex items-center gap-3">
                <UserX className="w-5 h-5 text-[#991b1b]" />
                <div>
                  <p className="text-sm text-[#991b1b]">Ausentes</p>
                  <p className="text-xl text-[#991b1b]">{stats.attendance.absent}</p>
                </div>
              </div>
              <span className="text-sm text-[#991b1b]">{stats.attendance.absentPct}</span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-[#fef3c7]">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-[#92400e]" />
                <div>
                  <p className="text-sm text-[#92400e]">Tardanzas</p>
                  <p className="text-xl text-[#92400e]">{stats.attendance.late}</p>
                </div>
              </div>
              <span className="text-sm text-[#92400e]">{stats.attendance.latePct}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Actividad Reciente</h3>
          <ActivityList items={stats.recentActivity} />
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Acciones Rápidas</h3>
          <div className="space-y-3">
            <Link to="/clases" className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
              <BookOpen className="w-5 h-5 text-[#2563eb]" />
              <span className="text-sm text-[#1e293b]">Ver mis clases</span>
            </Link>
            <Link to="/asistencia" className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
              <ClipboardCheck className="w-5 h-5 text-[#2563eb]" />
              <span className="text-sm text-[#1e293b]">Tomar asistencia</span>
            </Link>
            <Link to="/calificaciones" className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
              <CalendarDays className="w-5 h-5 text-[#2563eb]" />
              <span className="text-sm text-[#1e293b]">Registrar notas</span>
            </Link>
            <Link to="/mensajeria" className="flex items-center gap-3 p-3 rounded-lg border border-[#e2e8f0] hover:bg-[#f8fafc] hover:border-[#2563eb] transition-colors">
              <CheckCircle2 className="w-5 h-5 text-[#2563eb]" />
              <span className="text-sm text-[#1e293b]">Mensajes</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isProfesor } = useAuth();
  const { showToast } = useToast();
  const { directorStats, profesorStats, loading, error } = useDashboardData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);

  if (loading) return <LoadingSpinner />;

  if (isProfesor) {
    return <ProfesorDashboard userName={user?.name ?? "Profesor"} stats={profesorStats} />;
  }

  return <DirectorDashboard stats={directorStats} />;
}
