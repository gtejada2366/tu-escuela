import { useState } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { useToast } from "../components/Toast";
import { ArrowLeft, Users, ClipboardCheck, BarChart3, FileText, Save } from "lucide-react";

const classesData = [
  { id: 1, name: "Matemática 3° Primaria A", students: 28 },
  { id: 2, name: "Matemática 4° Primaria B", students: 25 },
  { id: 3, name: "Álgebra 2° Secundaria A", students: 30 },
];

const studentsData = [
  { id: 1, name: "María González Pérez", status: "enrolled" },
  { id: 2, name: "Juan Pérez Rodríguez", status: "enrolled" },
  { id: 3, name: "Sofía Martínez López", status: "enrolled" },
  { id: 4, name: "Diego Ramírez Silva", status: "enrolled" },
  { id: 5, name: "Valentina Torres Castro", status: "enrolled" },
  { id: 6, name: "Mateo Flores Ruiz", status: "enrolled" },
  { id: 7, name: "Isabella Vargas Díaz", status: "enrolled" },
  { id: 8, name: "Santiago Morales Cruz", status: "enrolled" },
];

const initialAttendanceData = [
  { id: 1, name: "María González Pérez", status: "present" },
  { id: 2, name: "Juan Pérez Rodríguez", status: "present" },
  { id: 3, name: "Sofía Martínez López", status: "absent" },
  { id: 4, name: "Diego Ramírez Silva", status: "late" },
  { id: 5, name: "Valentina Torres Castro", status: "present" },
  { id: 6, name: "Mateo Flores Ruiz", status: "present" },
  { id: 7, name: "Isabella Vargas Díaz", status: "present" },
  { id: 8, name: "Santiago Morales Cruz", status: "late" },
];

interface GradeRow {
  id: number; name: string; exam1: number; exam2: number; homework: number; average: number;
}

const initialGradesData: GradeRow[] = [
  { id: 1, name: "María González Pérez", exam1: 18, exam2: 17, homework: 19, average: 18 },
  { id: 2, name: "Juan Pérez Rodríguez", exam1: 16, exam2: 15, homework: 17, average: 16 },
  { id: 3, name: "Sofía Martínez López", exam1: 19, exam2: 20, homework: 18, average: 19 },
  { id: 4, name: "Diego Ramírez Silva", exam1: 14, exam2: 13, homework: 15, average: 14 },
  { id: 5, name: "Valentina Torres Castro", exam1: 17, exam2: 18, homework: 17, average: 17.3 },
  { id: 6, name: "Mateo Flores Ruiz", exam1: 15, exam2: 16, homework: 16, average: 15.7 },
  { id: 7, name: "Isabella Vargas Díaz", exam1: 18, exam2: 17, homework: 19, average: 18 },
  { id: 8, name: "Santiago Morales Cruz", exam1: 16, exam2: 17, homework: 15, average: 16 },
];

interface Homework {
  id: number; title: string; dueDate: string; description: string; submitted: number; total: number;
}

const initialHomeworkData: Homework[] = [
  { id: 1, title: "Ecuaciones de primer grado", dueDate: "2026-03-15", description: "Resolver ejercicios 1 al 20 del libro de texto, capítulo 5.", submitted: 24, total: 28 },
  { id: 2, title: "Sistemas de ecuaciones", dueDate: "2026-03-22", description: "Resolver los sistemas de 2 incógnitas de la hoja de trabajo.", submitted: 28, total: 28 },
  { id: 3, title: "Geometría básica", dueDate: "2026-03-29", description: "Calcular áreas y perímetros de las figuras proporcionadas.", submitted: 18, total: 28 },
];

type Tab = "students" | "attendance" | "grades" | "homework";

const formatDateDisplay = (dateStr: string) => {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
};

export function ProfesorGestionAcademica() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [selectedClass, setSelectedClass] = useState(classesData[0]);
  const [activeTab, setActiveTab] = useState<Tab>("students");
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<number, string>>(
    initialAttendanceData.reduce((acc, student) => ({ ...acc, [student.id]: student.status }), {})
  );
  const [grades, setGrades] = useState<GradeRow[]>(initialGradesData);
  const [homeworks, setHomeworks] = useState<Homework[]>(initialHomeworkData);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Homework modal states
  const [showHomeworkModal, setShowHomeworkModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingHomework, setEditingHomework] = useState<Homework | null>(null);
  const [viewingHomework, setViewingHomework] = useState<Homework | null>(null);
  const [hwForm, setHwForm] = useState({ title: "", dueDate: "", description: "" });

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  const getStatusBadge = (status: string) => {
    switch (status) { case "enrolled": return <Badge variant="success">Matriculado</Badge>; default: return <Badge variant="neutral">{status}</Badge>; }
  };

  const getAttendanceBadge = (status: string) => {
    switch (status) { case "present": return <Badge variant="success">Presente</Badge>; case "absent": return <Badge variant="danger">Ausente</Badge>; case "late": return <Badge variant="warning">Tardanza</Badge>; default: return <Badge variant="neutral">{status}</Badge>; }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 17) return "text-[#10b981]"; if (grade >= 14) return "text-[#f59e0b]"; return "text-[#dc2626]";
  };

  const handleAttendanceChange = (studentId: number, status: string) => {
    setAttendanceStatuses(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    showToast("Asistencia registrada exitosamente");
  };

  const handleGradeChange = (studentId: number, field: "exam1" | "exam2" | "homework", value: string) => {
    const numValue = Math.min(20, Math.max(0, parseFloat(value) || 0));
    setGrades(prev => prev.map(g => {
      if (g.id === studentId) {
        const updated = { ...g, [field]: numValue };
        updated.average = parseFloat(((updated.exam1 + updated.exam2 + updated.homework) / 3).toFixed(1));
        return updated;
      }
      return g;
    }));
  };

  const handleSaveGrades = () => {
    showToast("Calificaciones guardadas exitosamente");
  };

  const openCreateHomework = () => {
    setEditingHomework(null);
    setHwForm({ title: "", dueDate: "", description: "" });
    setShowHomeworkModal(true);
  };

  const openEditHomework = (hw: Homework) => {
    setEditingHomework(hw);
    setHwForm({ title: hw.title, dueDate: hw.dueDate, description: hw.description });
    setShowHomeworkModal(true);
  };

  const openViewHomework = (hw: Homework) => {
    setViewingHomework(hw);
    setShowViewModal(true);
  };

  const handleSaveHomework = () => {
    if (!hwForm.title.trim() || !hwForm.dueDate) {
      showToast("Completa todos los campos obligatorios", "error");
      return;
    }
    if (editingHomework) {
      setHomeworks(prev => prev.map(h => h.id === editingHomework.id ? { ...h, title: hwForm.title, dueDate: hwForm.dueDate, description: hwForm.description } : h));
      showToast("Tarea actualizada exitosamente");
    } else {
      const newHw: Homework = {
        id: Math.max(...homeworks.map(h => h.id), 0) + 1,
        title: hwForm.title,
        dueDate: hwForm.dueDate,
        description: hwForm.description,
        submitted: 0,
        total: selectedClass.students,
      };
      setHomeworks(prev => [...prev, newHw]);
      showToast("Tarea creada exitosamente");
    }
    setShowHomeworkModal(false);
  };

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "students", label: "Estudiantes", icon: Users },
    { key: "attendance", label: "Asistencia", icon: ClipboardCheck },
    { key: "grades", label: "Calificaciones", icon: BarChart3 },
    { key: "homework", label: "Tareas", icon: FileText },
  ];

  const sortedStudentsData = sortData(studentsData, sortKey, sortDir);
  const sortedAttendanceData = sortData(initialAttendanceData, sortKey, sortDir);
  const sortedGrades = sortData(grades, sortKey, sortDir);

  return (
    <div className="space-y-6">
      <Link to={`/profesores/${id}`} className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver al Perfil
      </Link>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h1 className="text-2xl text-[#1e293b] mb-2">Gestión Académica</h1>
        <p className="text-sm text-[#64748b]">Administra tus clases, asistencia y calificaciones</p>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-sm text-[#64748b] uppercase tracking-wider mb-3">Seleccionar Clase</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classesData.map((classItem) => (
            <button key={classItem.id} onClick={() => setSelectedClass(classItem)} className={`p-4 rounded-lg border-2 transition-all text-left ${selectedClass.id === classItem.id ? "border-[#2563eb] bg-[#eff6ff]" : "border-border bg-white hover:bg-[#f8fafc]"}`}>
              <h3 className="text-base text-[#1e293b] mb-1">{classItem.name}</h3>
              <div className="flex items-center gap-2 text-sm text-[#64748b]"><Users className="w-4 h-4" />{classItem.students} estudiantes</div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm">
        <div className="border-b border-border">
          <div className="flex overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`flex items-center gap-2 px-6 py-4 text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "border-[#2563eb] text-[#2563eb]" : "border-transparent text-[#64748b] hover:text-[#1e293b]"}`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {activeTab === "students" && (
            <div>
              <h3 className="text-lg text-[#1e293b] mb-4">Estudiantes de {selectedClass.name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fafc] border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">#</th>
                      <SortableHeader label="Nombre" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                      <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedStudentsData.map((student, index) => (
                      <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3"><span className="text-sm text-[#64748b]">{index + 1}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                        <td className="px-4 py-3">{getStatusBadge(student.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "attendance" && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-lg text-[#1e293b] mb-1">Registro de Asistencia</h3>
                  <p className="text-sm text-[#64748b]">{selectedClass.name} - {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <button onClick={handleSaveAttendance} className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"><Save className="w-4 h-4" /> Registrar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fafc] border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">#</th>
                      <SortableHeader label="Nombre" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                      <th className="px-4 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedAttendanceData.map((student, index) => (
                      <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3"><span className="text-sm text-[#64748b]">{index + 1}</span></td>
                        <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <select value={attendanceStatuses[student.id]} onChange={(e) => handleAttendanceChange(student.id, e.target.value)} className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                              <option value="present">Presente</option><option value="absent">Ausente</option><option value="late">Tardanza</option>
                            </select>
                            {getAttendanceBadge(attendanceStatuses[student.id])}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "grades" && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg text-[#1e293b]">Calificaciones - {selectedClass.name}</h3>
                <button onClick={handleSaveGrades} className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"><Save className="w-4 h-4" /> Guardar</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#f8fafc] border-b border-border">
                    <tr>
                      <SortableHeader label="Estudiante" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                      <SortableHeader label="Examen 1" sortKey="exam1" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                      <SortableHeader label="Examen 2" sortKey="exam2" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                      <SortableHeader label="Tarea" sortKey="homework" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                      <SortableHeader label="Promedio" sortKey="average" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {sortedGrades.map((student) => (
                      <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                        <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                        <td className="px-4 py-3 text-center"><input type="number" value={student.exam1} onChange={(e) => handleGradeChange(student.id, "exam1", e.target.value)} min="0" max="20" className="w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></td>
                        <td className="px-4 py-3 text-center"><input type="number" value={student.exam2} onChange={(e) => handleGradeChange(student.id, "exam2", e.target.value)} min="0" max="20" className="w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></td>
                        <td className="px-4 py-3 text-center"><input type="number" value={student.homework} onChange={(e) => handleGradeChange(student.id, "homework", e.target.value)} min="0" max="20" className="w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" /></td>
                        <td className="px-4 py-3 text-center"><span className={`text-sm ${getGradeColor(student.average)}`}>{student.average}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "homework" && (
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-lg text-[#1e293b]">Tareas - {selectedClass.name}</h3>
                <button onClick={openCreateHomework} className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"><FileText className="w-4 h-4" /> Crear Tarea</button>
              </div>
              <div className="space-y-4">
                {homeworks.map((homework) => (
                  <div key={homework.id} className="p-4 border border-border rounded-lg hover:bg-[#f8fafc] transition-colors">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="text-base text-[#1e293b] mb-2">{homework.title}</h4>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
                          <span>Entrega: {formatDateDisplay(homework.dueDate)}</span>
                          <span>Entregas: {homework.submitted}/{homework.total}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openViewHomework(homework)} className="px-3 py-1.5 text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Ver</button>
                        <button onClick={() => openEditHomework(homework)} className="px-3 py-1.5 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Editar</button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="w-full bg-[#f1f5f9] rounded-full h-2">
                        <div className="bg-[#10b981] h-2 rounded-full transition-all" style={{ width: `${(homework.submitted / homework.total) * 100}%` }} />
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">{Math.round((homework.submitted / homework.total) * 100)}% completado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Homework Modal */}
      <Modal isOpen={showHomeworkModal} onClose={() => setShowHomeworkModal(false)} title={editingHomework ? "Editar Tarea" : "Crear Tarea"}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Título *</label>
            <input type="text" value={hwForm.title} onChange={(e) => setHwForm(prev => ({ ...prev, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" placeholder="Ej: Ecuaciones de segundo grado" />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Fecha de Entrega *</label>
            <input type="date" value={hwForm.dueDate} onChange={(e) => setHwForm(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]" />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Descripción</label>
            <textarea value={hwForm.description} onChange={(e) => setHwForm(prev => ({ ...prev, description: e.target.value }))} rows={4} className="w-full px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] resize-none" placeholder="Instrucciones para los estudiantes..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button onClick={() => setShowHomeworkModal(false)} className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#1e293b] hover:bg-[#f8fafc] transition-colors">Cancelar</button>
            <button onClick={handleSaveHomework} className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors">{editingHomework ? "Guardar Cambios" : "Crear Tarea"}</button>
          </div>
        </div>
      </Modal>

      {/* View Homework Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Detalle de Tarea" size="lg">
        {viewingHomework && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg text-[#1e293b] mb-1">{viewingHomework.title}</h3>
              <p className="text-sm text-[#64748b]">{selectedClass.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-[#f8fafc] rounded-lg">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Fecha de Entrega</p>
                <p className="text-sm text-[#1e293b]">{formatDateDisplay(viewingHomework.dueDate)}</p>
              </div>
              <div className="p-3 bg-[#f8fafc] rounded-lg">
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Entregas</p>
                <p className="text-sm text-[#1e293b]">{viewingHomework.submitted} de {viewingHomework.total}</p>
              </div>
            </div>
            {viewingHomework.description && (
              <div>
                <p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Descripción</p>
                <p className="text-sm text-[#1e293b]">{viewingHomework.description}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[#64748b] uppercase tracking-wider mb-2">Progreso de Entregas</p>
              <div className="w-full bg-[#f1f5f9] rounded-full h-3">
                <div className="bg-[#10b981] h-3 rounded-full transition-all" style={{ width: `${(viewingHomework.submitted / viewingHomework.total) * 100}%` }} />
              </div>
              <p className="text-sm text-[#64748b] mt-1">{Math.round((viewingHomework.submitted / viewingHomework.total) * 100)}% completado</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-border">
              <button onClick={() => { setShowViewModal(false); openEditHomework(viewingHomework); }} className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors">Editar Tarea</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
