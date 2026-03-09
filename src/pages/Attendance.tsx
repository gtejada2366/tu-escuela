import { useState, useRef, useEffect } from "react";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Calendar, Users, CheckCircle2, XCircle, Clock, Filter, ChevronDown } from "lucide-react";
import { useAttendanceData, type AttendanceStatus, type StudentRecord, type ClassAttendance } from "../hooks/useAttendanceData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { UnsavedChangesGuard } from "../components/UnsavedChangesGuard";

const gradeFilterOptions = ["Todos", "Inicial", "Primaria", "Secundaria"];

function formatDateToSpanish(date: Date): string {
  const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName}, ${day} de ${month} ${year}`;
}

function toInputDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function Attendance() {
  const { showToast } = useToast();
  const { classesData, selectedDate, changeDate, loading, error, saveAttendance, loadClassStudents } = useAttendanceData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gradeFilter, setGradeFilter] = useState("Todos");
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [detailClassId, setDetailClassId] = useState<number | null>(null);
  const [editStudents, setEditStudents] = useState<StudentRecord[]>([]);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);
  const [isDirty, setIsDirty] = useState(false);

  const datePickerRef = useRef<HTMLDivElement>(null);
  const gradeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(e.target as Node)) {
        setShowGradeDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  const filteredClasses = gradeFilter === "Todos"
    ? classesData
    : classesData.filter((cls) => {
        if (gradeFilter === "Inicial") return cls.grade.includes("años");
        if (gradeFilter === "Primaria") return cls.grade.includes("Primaria");
        if (gradeFilter === "Secundaria") return cls.grade.includes("Secundaria");
        return true;
      });

  const sortedClasses = sortData(filteredClasses, sortKey, sortDir);

  const totalStudents = filteredClasses.reduce((acc, cls) => acc + cls.total, 0);
  const totalPresent = filteredClasses.reduce((acc, cls) => acc + cls.present, 0);
  const totalAbsent = filteredClasses.reduce((acc, cls) => acc + cls.absent, 0);
  const totalLate = filteredClasses.reduce((acc, cls) => acc + cls.late, 0);
  const overallPercentage = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : "0.0";

  const detailClass = detailClassId !== null ? classesData.find((c) => c.id === detailClassId) : null;

  async function handleOpenDetail(cls: ClassAttendance) {
    setDetailClassId(cls.id);
    if (cls.students.length > 0) {
      setEditStudents(cls.students.map((s) => ({ ...s })));
    } else {
      // Supabase mode: fetch students on demand
      const students = await loadClassStudents(cls.id);
      setEditStudents(students.map((s) => ({ ...s })));
    }
  }

  function handleCloseDetail() {
    setDetailClassId(null);
    setEditStudents([]);
  }

  function handleStudentStatusChange(studentId: number, newStatus: AttendanceStatus) {
    setEditStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s))
    );
    setIsDirty(true);
  }

  async function handleSaveDetail() {
    if (detailClassId === null) return;
    try {
      await saveAttendance(detailClassId, editStudents);
      showToast("Asistencia actualizada correctamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setIsDirty(false);
    handleCloseDetail();
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = e.target.value.split("-");
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      changeDate(d);
    }
    setShowDatePicker(false);
  }

  function handleGradeSelect(option: string) {
    setGradeFilter(option);
    setShowGradeDropdown(false);
  }

  if (loading) return <LoadingSpinner />;

  const statusColor = (status: AttendanceStatus) => {
    if (status === "Presente") return "text-[#10b981]";
    if (status === "Ausente") return "text-[#dc2626]";
    return "text-[#f59e0b]";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Registro de Asistencia</h1>
        <p className="text-sm text-[#64748b]">Control diario de asistencia por clase</p>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Date Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => { setShowDatePicker((v) => !v); setShowGradeDropdown(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Calendar className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{formatDateToSpanish(selectedDate)}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showDatePicker && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg p-3 z-20">
                <input
                  type="date"
                  value={toInputDateString(selectedDate)}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb]"
                />
              </div>
            )}
          </div>

          {/* Grade Filter */}
          <div className="relative" ref={gradeDropdownRef}>
            <button
              onClick={() => { setShowGradeDropdown((v) => !v); setShowDatePicker(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">
                {gradeFilter === "Todos" ? "Filtrar por Grado" : gradeFilter}
              </span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showGradeDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-border rounded-lg shadow-lg z-20 min-w-[180px] py-1">
                {gradeFilterOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleGradeSelect(option)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      gradeFilter === option
                        ? "bg-[#eff6ff] text-[#2563eb]"
                        : "text-[#1e293b] hover:bg-[#f8fafc]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#eff6ff]"><Users className="w-5 h-5 text-[#2563eb]" /></div>
            <span className="text-sm text-[#64748b]">Total</span>
          </div>
          <p className="text-3xl text-[#1e293b]">{totalStudents}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#d1fae5]"><CheckCircle2 className="w-5 h-5 text-[#10b981]" /></div>
            <span className="text-sm text-[#64748b]">Presentes</span>
          </div>
          <p className="text-3xl text-[#10b981]">{totalPresent}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#fee2e2]"><XCircle className="w-5 h-5 text-[#dc2626]" /></div>
            <span className="text-sm text-[#64748b]">Ausentes</span>
          </div>
          <p className="text-3xl text-[#dc2626]">{totalAbsent}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-[#fef3c7]"><Clock className="w-5 h-5 text-[#f59e0b]" /></div>
            <span className="text-sm text-[#64748b]">Tardanzas</span>
          </div>
          <p className="text-3xl text-[#f59e0b]">{totalLate}</p>
        </div>
      </div>

      {/* Class Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-lg text-[#1e293b]">Asistencia por Clase</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#64748b]">Promedio General:</span>
              <span className="text-lg text-[#10b981]">{overallPercentage}%</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Grado/Sección" sortKey="grade" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="left" />
                <SortableHeader label="Total" sortKey="total" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Presentes" sortKey="present" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Ausentes" sortKey="absent" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Tardanzas" sortKey="late" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" className="hidden sm:table-cell" />
                <SortableHeader label="Porcentaje" sortKey="percentage" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <th className="px-6 py-3 text-center text-xs text-[#64748b] uppercase tracking-wider hidden md:table-cell">Estado</th>
                <th className="px-6 py-3 text-center text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedClasses.map((cls) => (
                <tr key={cls.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{cls.grade}</span></td>
                  <td className="px-6 py-4 text-center"><span className="text-sm text-[#64748b]">{cls.total}</span></td>
                  <td className="px-6 py-4 text-center"><span className="text-sm text-[#10b981]">{cls.present}</span></td>
                  <td className="px-6 py-4 text-center"><span className="text-sm text-[#dc2626]">{cls.absent}</span></td>
                  <td className="px-6 py-4 text-center hidden sm:table-cell"><span className="text-sm text-[#f59e0b]">{cls.late}</span></td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-sm ${cls.percentage >= 95 ? 'text-[#10b981]' : cls.percentage >= 90 ? 'text-[#f59e0b]' : 'text-[#dc2626]'}`}>{cls.percentage}%</span>
                  </td>
                  <td className="px-6 py-4 text-center hidden md:table-cell">
                    {cls.percentage === 100 ? <Badge variant="success">Completo</Badge> : cls.percentage >= 90 ? <Badge variant="info">Bueno</Badge> : <Badge variant="warning">Regular</Badge>}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenDetail(cls)}
                      className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={detailClassId !== null}
        onClose={handleCloseDetail}
        title={detailClass ? `Detalle de Asistencia - ${detailClass.grade}` : "Detalle de Asistencia"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f8fafc] border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Estudiante</th>
                  <th className="px-4 py-3 text-center text-xs text-[#64748b] uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {editStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#64748b]">{index + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#1e293b]">{student.name}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <select
                        value={student.status}
                        onChange={(e) => handleStudentStatusChange(student.id, e.target.value as AttendanceStatus)}
                        className={`text-sm px-3 py-1.5 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30 focus:border-[#2563eb] ${statusColor(student.status)} bg-white cursor-pointer`}
                      >
                        <option value="Presente" className="text-[#10b981]">Presente</option>
                        <option value="Ausente" className="text-[#dc2626]">Ausente</option>
                        <option value="Tardanza" className="text-[#f59e0b]">Tardanza</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveDetail}
              className="px-5 py-2 bg-[#2563eb] text-white text-sm rounded-lg hover:bg-[#1d4ed8] transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
      <UnsavedChangesGuard isDirty={isDirty} />
    </div>
  );
}
