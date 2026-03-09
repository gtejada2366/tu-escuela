import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { useToast } from "../components/Toast";
import { ArrowLeft, Edit, UserPlus, BookOpen, User, Clock, MapPin } from "lucide-react";
import { useClaseDetailData } from "../hooks/useClaseDetailData";
import { LoadingSpinner } from "../components/LoadingSpinner";

const dayAbbrevMap: Record<string, string> = {
  Lun: "Lunes",
  Mar: "Martes",
  Mie: "Miércoles",
  Jue: "Jueves",
  Vie: "Viernes",
};

function buildWeeklySchedule(schedule: string, classroom: string) {
  const allDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  // Parse schedule like "Lun-Mie-Vie 8:00-9:30"
  const parts = schedule.split(" ");
  const daysPart = parts[0] ?? "";
  const timePart = parts.slice(1).join(" ") || "-";
  const activeAbbrevs = daysPart.split("-");
  const activeDays = new Set(activeAbbrevs.map((abbr) => dayAbbrevMap[abbr] ?? abbr));

  return allDays.map((day) => ({
    day,
    time: activeDays.has(day) ? timePart : "-",
    classroom: activeDays.has(day) ? classroom : "-",
  }));
}

export function ClaseDetail() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { classInfo, students, loading, found, error, updateClassInfo, addStudent: addStudentToClass } = useClaseDetailData(id);

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Edit class modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editTeacher, setEditTeacher] = useState("");
  const [editSchedule, setEditSchedule] = useState("");
  const [editClassroom, setEditClassroom] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Add student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentCode, setNewStudentCode] = useState("");

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  if (loading) return <LoadingSpinner />;

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return "text-[#10b981]";
    if (percentage >= 90) return "text-[#f59e0b]";
    return "text-[#dc2626]";
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 17) return "text-[#10b981]";
    if (grade >= 14) return "text-[#f59e0b]";
    return "text-[#dc2626]";
  };

  const handleOpenEditModal = () => {
    setEditSubject(classInfo.subject);
    setEditGrade(classInfo.grade);
    setEditSection(classInfo.section);
    setEditTeacher(classInfo.teacher);
    setEditSchedule(classInfo.schedule);
    setEditClassroom(classInfo.classroom);
    setEditStatus(classInfo.status);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editSubject.trim()) {
      showToast("La materia es obligatoria", "error");
      return;
    }
    if (!editTeacher.trim()) {
      showToast("El profesor es obligatorio", "error");
      return;
    }

    try {
      await updateClassInfo({
        subject: editSubject.trim(),
        grade: editGrade.trim(),
        section: editSection.trim(),
        teacher: editTeacher.trim(),
        schedule: editSchedule.trim(),
        classroom: editClassroom.trim(),
        status: editStatus,
      });
      showToast("Clase actualizada correctamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowEditModal(false);
  };

  const generateStudentCode = () => {
    const maxCode = students.reduce((max, s) => {
      const num = parseInt(s.code.split("-").pop() || "0", 10);
      return num > max ? num : max;
    }, 0);
    return `EST-2023-${String(maxCode + 1).padStart(3, "0")}`;
  };

  const handleOpenAddStudentModal = () => {
    setNewStudentName("");
    setNewStudentCode(generateStudentCode());
    setShowAddStudentModal(true);
  };

  const sortedStudents = sortData(students, sortKey, sortDir);

  const weeklySchedule = buildWeeklySchedule(classInfo.schedule, classInfo.classroom);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newStudentName.trim()) {
      showToast("El nombre del estudiante es obligatorio", "error");
      return;
    }

    try {
      await addStudentToClass(newStudentName.trim(), newStudentCode);
      showToast("Estudiante agregado correctamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowAddStudentModal(false);
  };

  if (!found) {
    return (
      <div className="space-y-6">
        <Link to="/clases" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a Clases
        </Link>
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
          <h1 className="text-2xl text-[#1e293b] mb-2">Clase no encontrada</h1>
          <p className="text-[#64748b] mb-6">No se encontró una clase con el ID "{id}".</p>
          <Link to="/clases" className="inline-flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver a Clases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/clases" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Clases
      </Link>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-lg bg-[#eff6ff] flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-[#2563eb]" />
              </div>
              <div>
                <h1 className="text-2xl text-[#1e293b]">{classInfo.subject} {classInfo.grade}{classInfo.section}</h1>
                <p className="text-sm text-[#64748b]">Grado {classInfo.grade} - Sección {classInfo.section}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-[#64748b]"><User className="w-4 h-4" /><span>Prof. {classInfo.teacher}</span></div>
              <div className="flex items-center gap-2 text-sm text-[#64748b]"><BookOpen className="w-4 h-4" /><span>{students.length} estudiantes</span></div>
              <Badge variant={classInfo.status === "active" ? "success" : "neutral"}>
                {classInfo.status === "active" ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleOpenEditModal}
              className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
            >
              <Edit className="w-4 h-4" /> Editar Clase
            </button>
            <button
              onClick={handleOpenAddStudentModal}
              className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
            >
              <UserPlus className="w-4 h-4" /> Agregar Estudiante
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><BookOpen className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Materia</p></div>
          <p className="text-lg text-[#1e293b]">{classInfo.subject}</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><User className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Profesor</p></div>
          <Link to={`/profesores/${classInfo.teacherId}`} className="text-lg text-[#2563eb] hover:text-[#1d4ed8] transition-colors">{classInfo.teacher}</Link>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><Clock className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Horario</p></div>
          <p className="text-sm text-[#1e293b]">{classInfo.schedule}</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><MapPin className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Aula</p></div>
          <p className="text-lg text-[#1e293b]">{classInfo.classroom}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Lista de Estudiantes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">#</th>
                <SortableHeader label="Nombre" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Código" sortKey="code" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Asistencia" sortKey="attendance" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Promedio" sortKey="average" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((student, index) => (
                <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3"><span className="text-sm text-[#64748b]">{index + 1}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                  <td className="px-4 py-3 hidden md:table-cell"><span className="text-sm text-[#64748b]">{student.code}</span></td>
                  <td className="px-4 py-3"><span className={`text-sm ${getAttendanceColor(student.attendance)}`}>{student.attendance}%</span></td>
                  <td className="px-4 py-3"><span className={`text-sm ${getGradeColor(student.average)}`}>{student.average}</span></td>
                  <td className="px-4 py-3"><Link to={`/estudiantes/${student.id}`} className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Ver Perfil</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Horario Semanal</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {weeklySchedule.map((schedule, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <h3 className="text-sm text-[#1e293b] mb-3">{schedule.day}</h3>
              {schedule.time !== "-" ? (
                <div className="bg-[#eff6ff] rounded p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[#64748b]"><Clock className="w-3 h-3" />{schedule.time}</div>
                  <div className="flex items-center gap-2 text-xs text-[#2563eb]"><MapPin className="w-3 h-3" />{schedule.classroom}</div>
                </div>
              ) : (
                <div className="h-16 flex items-center justify-center text-xs text-[#94a3b8] border border-dashed border-border rounded">Sin clase</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Edit Class Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Clase"
        size="lg"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Materia</label>
              <input
                type="text"
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                placeholder="Ej: Matemática"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Profesor</label>
              <input
                type="text"
                value={editTeacher}
                onChange={(e) => setEditTeacher(e.target.value)}
                placeholder="Ej: María López"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Grado</label>
              <select
                value={editGrade}
                onChange={(e) => setEditGrade(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              >
                <optgroup label="Inicial">
                  <option value="3 años">3 años</option>
                  <option value="4 años">4 años</option>
                  <option value="5 años">5 años</option>
                </optgroup>
                <optgroup label="Primaria">
                  {[1,2,3,4,5,6].map(n => <option key={n} value={`${n}° Primaria`}>{n}° Primaria</option>)}
                </optgroup>
                <optgroup label="Secundaria">
                  {[1,2,3,4,5].map(n => <option key={n} value={`${n}° Secundaria`}>{n}° Secundaria</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Sección</label>
              <input
                type="text"
                value={editSection}
                onChange={(e) => setEditSection(e.target.value)}
                placeholder="Ej: A"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Horario</label>
              <input
                type="text"
                value={editSchedule}
                onChange={(e) => setEditSchedule(e.target.value)}
                placeholder="Ej: Lun-Mie-Vie 8:00-9:30"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[#1e293b] mb-1">Aula</label>
              <input
                type="text"
                value={editClassroom}
                onChange={(e) => setEditClassroom(e.target.value)}
                placeholder="Ej: Aula 205"
                className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Estado</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Student Modal */}
      <Modal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        title="Agregar Estudiante"
        size="md"
      >
        <form onSubmit={handleAddStudent} className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Ej: Ana María Rodríguez"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Código de estudiante</label>
            <input
              type="text"
              value={newStudentCode}
              readOnly
              className="w-full px-4 py-2 rounded-lg border border-border bg-[#f8fafc] text-sm text-[#64748b] cursor-not-allowed"
            />
            <p className="text-xs text-[#94a3b8] mt-1">El código se genera automáticamente</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddStudentModal(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
