import { useParams, Link } from "react-router";
import { Badge } from "../components/Badge";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface StudentDetail {
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
}

const studentsMap: Record<string, StudentDetail> = {
  "1": { name: "María González Pérez", avatar: "MG", code: "EST-2024-001", grade: "5° Primaria", section: "A", birthDate: "15/03/2015", address: "Av. Los Olivos 234, San Isidro", parent: "Carlos González Ruiz", parentPhone: "+51 987 654 321", parentEmail: "carlos.gonzalez@email.com", attendance: 96.5, paymentStatus: "paid", avgGrade: 17.0 },
  "2": { name: "Juan Pérez Rodríguez", avatar: "JP", code: "EST-2024-002", grade: "4° Primaria", section: "B", birthDate: "22/07/2016", address: "Jr. Las Flores 567, Miraflores", parent: "Ana Rodríguez", parentPhone: "+51 976 543 210", parentEmail: "ana.rodriguez@email.com", attendance: 94.2, paymentStatus: "paid", avgGrade: 16.5 },
  "3": { name: "Sofía Martínez López", avatar: "SM", code: "EST-2024-003", grade: "3° Secundaria", section: "A", birthDate: "10/11/2012", address: "Calle Los Pinos 890, Surco", parent: "Roberto Martínez", parentPhone: "+51 965 432 109", parentEmail: "roberto.martinez@email.com", attendance: 98.1, paymentStatus: "pending", avgGrade: 19.0 },
  "4": { name: "Diego Ramírez Silva", avatar: "DR", code: "EST-2024-004", grade: "2° Secundaria", section: "B", birthDate: "03/05/2013", address: "Av. Primavera 123, San Borja", parent: "Patricia Silva", parentPhone: "+51 954 321 098", parentEmail: "patricia.silva@email.com", attendance: 89.3, paymentStatus: "overdue", avgGrade: 14.0 },
  "5": { name: "Valentina Torres Castro", avatar: "VT", code: "EST-2024-005", grade: "4 años", section: "A", birthDate: "28/01/2022", address: "Jr. Los Cedros 456, La Molina", parent: "Luis Torres", parentPhone: "+51 943 210 987", parentEmail: "luis.torres@email.com", attendance: 97.8, paymentStatus: "paid", avgGrade: 17.0 },
  "6": { name: "Mateo Flores Ruiz", avatar: "MF", code: "EST-2024-006", grade: "1° Secundaria", section: "A", birthDate: "19/09/2014", address: "Av. Javier Prado 789, Magdalena", parent: "Carmen Flores", parentPhone: "+51 932 109 876", parentEmail: "carmen.flores@email.com", attendance: 91.5, paymentStatus: "paid", avgGrade: 15.5 },
  "7": { name: "Isabella Vargas Díaz", avatar: "IV", code: "EST-2024-007", grade: "5 años", section: "B", birthDate: "07/04/2021", address: "Calle Las Palmeras 321, Jesús María", parent: "Fernando Vargas", parentPhone: "+51 921 098 765", parentEmail: "fernando.vargas@email.com", attendance: 95.2, paymentStatus: "pending", avgGrade: 18.0 },
  "8": { name: "Santiago Morales Cruz", avatar: "SC", code: "EST-2024-008", grade: "3° Primaria", section: "A", birthDate: "14/12/2017", address: "Av. Brasil 654, Pueblo Libre", parent: "Elena Morales", parentPhone: "+51 910 987 654", parentEmail: "elena.morales@email.com", attendance: 93.7, paymentStatus: "paid", avgGrade: 16.0 },
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
  if (paymentStatus === "paid") {
    return [
      { id: 1, month: "Marzo 2026", amount: "S/ 450", status: "paid" as const, date: "01/03/2026" },
      { id: 2, month: "Febrero 2026", amount: "S/ 450", status: "paid" as const, date: "01/02/2026" },
      { id: 3, month: "Enero 2026", amount: "S/ 450", status: "paid" as const, date: "02/01/2026" },
    ];
  }
  if (paymentStatus === "pending") {
    return [
      { id: 1, month: "Marzo 2026", amount: "S/ 450", status: "pending" as const, date: "—" },
      { id: 2, month: "Febrero 2026", amount: "S/ 450", status: "paid" as const, date: "03/02/2026" },
      { id: 3, month: "Enero 2026", amount: "S/ 450", status: "paid" as const, date: "02/01/2026" },
    ];
  }
  // overdue
  return [
    { id: 1, month: "Marzo 2026", amount: "S/ 450", status: "overdue" as const, date: "—" },
    { id: 2, month: "Febrero 2026", amount: "S/ 450", status: "overdue" as const, date: "—" },
    { id: 3, month: "Enero 2026", amount: "S/ 450", status: "paid" as const, date: "05/01/2026" },
  ];
}

function getAttendanceCounts(baseAttendance: number) {
  const totalDays = 142;
  const present = Math.round(totalDays * baseAttendance / 100);
  const absent = totalDays - present - Math.round((100 - baseAttendance) / 3);
  const late = totalDays - present - Math.max(0, absent);
  return { present, absent: Math.max(0, totalDays - present - Math.max(0, late)), late: Math.max(0, late) };
}

function getPaymentBadge(status: "paid" | "pending" | "overdue") {
  if (status === "paid") return <Badge variant="success">Pagado</Badge>;
  if (status === "pending") return <Badge variant="warning">Pendiente</Badge>;
  return <Badge variant="danger">Vencido</Badge>;
}

function getPaymentTotal(payments: { status: string }[]) {
  const paidCount = payments.filter((p) => p.status === "paid").length;
  return `S/ ${(paidCount * 450).toLocaleString()}`;
}

export function StudentProfile() {
  const { id } = useParams();
  const student = id ? studentsMap[id] : undefined;

  if (!student) {
    return (
      <div className="space-y-6">
        <Link to="/estudiantes" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a Estudiantes
        </Link>
        <div className="bg-white rounded-lg p-12 border border-border shadow-sm text-center">
          <p className="text-lg text-[#1e293b] mb-2">Estudiante no encontrado</p>
          <p className="text-sm text-[#64748b]">El estudiante que buscas no existe.</p>
        </div>
      </div>
    );
  }

  const attendanceData = generateAttendanceData(student.attendance);
  const gradesData = generateGradesData(student.avgGrade);
  const paymentsHistory = generatePaymentsHistory(student.paymentStatus);
  const counts = getAttendanceCounts(student.attendance);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/estudiantes" className="p-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors">
          <ArrowLeft className="w-5 h-5 text-[#64748b]" />
        </Link>
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-1">Perfil de Estudiante</h1>
          <p className="text-sm text-[#64748b]">Información completa del estudiante</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-24 h-24 rounded-full bg-[#eff6ff] flex items-center justify-center">
              <span className="text-3xl text-[#2563eb]">{student.avatar}</span>
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl text-[#1e293b] mb-4">{student.name}</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Código:</span>
                  <span className="text-sm text-[#1e293b]">{student.code}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Grado:</span>
                  <span className="text-sm text-[#1e293b]">{student.grade} - Sección {student.section}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Fecha de Nacimiento:</span>
                  <span className="text-sm text-[#1e293b]">{student.birthDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Dirección:</span>
                  <span className="text-sm text-[#1e293b]">{student.address}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-sm text-[#64748b] mb-4">Datos del Apoderado</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Nombre:</span>
                  <span className="text-sm text-[#1e293b]">{student.parent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Teléfono:</span>
                  <span className="text-sm text-[#1e293b]">{student.parentPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Email:</span>
                  <span className="text-sm text-[#1e293b]">{student.parentEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">Dirección:</span>
                  <span className="text-sm text-[#1e293b]">{student.address}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="space-y-2">
              <Badge variant={student.paymentStatus === "overdue" ? "danger" : "success"}>
                {student.paymentStatus === "overdue" ? "Deuda" : "Activo"}
              </Badge>
              <div className="p-3 rounded-lg bg-[#eff6ff]">
                <p className="text-xs text-[#64748b]">Asistencia</p>
                <p className="text-xl text-[#2563eb]">{student.attendance}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Historial de Asistencia</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[85, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-[#d1fae5]">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-[#065f46]" />
                <span className="text-xs text-[#065f46]">Presentes</span>
              </div>
              <p className="text-xl text-[#065f46]">{counts.present}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#fee2e2]">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-[#991b1b]" />
                <span className="text-xs text-[#991b1b]">Ausentes</span>
              </div>
              <p className="text-xl text-[#991b1b]">{counts.absent}</p>
            </div>
            <div className="p-4 rounded-lg bg-[#fef3c7]">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-[#92400e]" />
                <span className="text-xs text-[#92400e]">Tardanzas</span>
              </div>
              <p className="text-xl text-[#92400e]">{counts.late}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <h3 className="text-lg text-[#1e293b] mb-4">Estado de Pagos</h3>
          <div className="space-y-4">
            {paymentsHistory.map((payment) => (
              <div key={payment.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#1e293b]">{payment.month}</span>
                  {getPaymentBadge(payment.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#64748b]">{payment.date}</span>
                  <span className="text-sm text-[#1e293b]">{payment.amount}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#64748b]">Total Pagado 2026</span>
            </div>
            <p className="text-2xl text-[#1e293b]">{getPaymentTotal(paymentsHistory)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
        <h3 className="text-lg text-[#1e293b] mb-4">Calificaciones - Primer Trimestre 2026</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={gradesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="subject" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} domain={[0, 20]} />
            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <Bar dataKey="grade" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {gradesData.map((item) => (
            <div key={item.subject} className="p-4 rounded-lg border border-border">
              <p className="text-xs text-[#64748b] mb-1">{item.subject}</p>
              <p className="text-2xl text-[#1e293b]">{item.grade}</p>
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
    </div>
  );
}
