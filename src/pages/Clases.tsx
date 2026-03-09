import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Search, Filter, Plus, ChevronDown, Eye, Edit } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  useClassesData,
  type ClassLocal,
  SUBJECT_OPTIONS,
  GRADE_OPTIONS_BY_LEVEL,

  SECTION_OPTIONS,
  STATUS_OPTIONS,
} from "../hooks/useClassesData";
import { LoadingSpinner } from "../components/LoadingSpinner";

type ClassItem = ClassLocal;

const ITEMS_PER_PAGE = 8;

const emptyForm = {
  subject: "",
  grade: "",
  section: "",
  teacher: "",
  students: 0,
  schedule: "",
  status: "active",
};

export function Clases() {
  const { showToast } = useToast();
  const { isProfesor } = useAuth();
  const { classes: classesFromHook, loading, addClass, updateClass, professorsList } = useClassesData();

  // Profesores only see their own classes
  const classes = classesFromHook;
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(e.target as Node)) {
        setGradeDropdownOpen(false);
      }
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setSubjectDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Activo</Badge>;
      case "inactive": return <Badge variant="neutral">Inactivo</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  // Filtering
  const filtered = classes.filter(c => {
    const matchesSearch =
      c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.teacher.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.grade.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter ? c.grade === gradeFilter : true;
    const matchesSubject = subjectFilter ? c.subject === subjectFilter : true;
    return matchesSearch && matchesGrade && matchesSubject;
  });

  const sorted = sortData(filtered, sortKey, sortDir);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedItems = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, subjectFilter]);

  // Create
  function handleOpenCreate() {
    setFormData(emptyForm);
    setCreateModalOpen(true);
  }

  async function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    await addClass({
      subject: formData.subject,
      grade: formData.grade,
      section: formData.section,
      teacher: formData.teacher,
      students: formData.students,
      schedule: formData.schedule,
      status: formData.status,
    });
    setCreateModalOpen(false);
    showToast("Clase creada exitosamente", "success");
  }

  // Edit
  function handleOpenEdit(classItem: ClassItem) {
    setEditingId(classItem.id);
    setFormData({
      subject: classItem.subject,
      grade: classItem.grade,
      section: classItem.section,
      teacher: classItem.teacher,
      students: classItem.students,
      schedule: classItem.schedule,
      status: classItem.status,
    });
    setEditModalOpen(true);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editingId !== null) {
      await updateClass(editingId, {
        subject: formData.subject,
        grade: formData.grade,
        section: formData.section,
        teacher: formData.teacher,
        students: formData.students,
        schedule: formData.schedule,
        status: formData.status,
      });
    }
    setEditModalOpen(false);
    setEditingId(null);
    showToast("Clase actualizada exitosamente", "success");
  }

  // Unique subjects from current data for filter dropdown
  const uniqueSubjects = Array.from(new Set(classes.map(c => c.subject))).sort();

  // Build page numbers array
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  if (loading) return <LoadingSpinner />;

  // Shared form fields for create/edit
  const formFields = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm text-[#1e293b] mb-1">Materia</label>
        <select
          value={formData.subject}
          onChange={e => setFormData(prev => ({ ...prev, subject: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          required
        >
          <option value="">Seleccionar materia</option>
          {SUBJECT_OPTIONS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-[#1e293b] mb-1">Grado</label>
          <select
            value={formData.grade}
            onChange={e => setFormData(prev => ({ ...prev, grade: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            required
          >
            <option value="">Seleccionar</option>
            {GRADE_OPTIONS_BY_LEVEL.map(group => (
              <optgroup key={group.level} label={group.level}>
                {group.grades.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-[#1e293b] mb-1">Sección</label>
          <select
            value={formData.section}
            onChange={e => setFormData(prev => ({ ...prev, section: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            required
          >
            <option value="">Seleccionar</option>
            {SECTION_OPTIONS.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm text-[#1e293b] mb-1">Profesor</label>
        <select
          value={formData.teacher}
          onChange={e => setFormData(prev => ({ ...prev, teacher: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          required
        >
          <option value="">Seleccionar profesor</option>
          {professorsList.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm text-[#1e293b] mb-1">Estudiantes</label>
        <input
          type="number"
          value={formData.students}
          onChange={e => setFormData(prev => ({ ...prev, students: Number(e.target.value) }))}
          min={0}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-[#1e293b] mb-1">Horario</label>
        <input
          type="text"
          value={formData.schedule}
          onChange={e => setFormData(prev => ({ ...prev, schedule: e.target.value }))}
          placeholder="Ej: Lun-Mie-Vie 8:00-9:30"
          className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-[#1e293b] mb-1">Estado</label>
        <select
          value={formData.status}
          onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          required
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">{isProfesor ? "Mis Clases" : "Clases"}</h1>
          <p className="text-sm text-[#64748b]">{isProfesor ? "Tus cursos y secciones asignadas" : "Gestiona todos los cursos y secciones del colegio"}</p>
        </div>
        {!isProfesor && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus className="w-4 h-4" /> Crear Clase
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Buscar por materia, grado o profesor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>

          {/* Grado filter dropdown */}
          <div className="relative" ref={gradeDropdownRef}>
            <button
              onClick={() => { setGradeDropdownOpen(prev => !prev); setSubjectDropdownOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{gradeFilter || "Grado"}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {gradeDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-border rounded-lg shadow-lg z-20">
                <button
                  onClick={() => { setGradeFilter(""); setGradeDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors rounded-t-lg"
                >
                  Todos
                </button>
                {GRADE_OPTIONS_BY_LEVEL.map(group => (
                  <div key={group.level}>
                    <div className="px-4 py-1.5 text-xs text-[#94a3b8] uppercase tracking-wider bg-[#f8fafc]">{group.level}</div>
                    {group.grades.map(g => (
                      <button
                        key={g}
                        onClick={() => { setGradeFilter(g); setGradeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${gradeFilter === g ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materia filter dropdown */}
          <div className="relative" ref={subjectDropdownRef}>
            <button
              onClick={() => { setSubjectDropdownOpen(prev => !prev); setGradeDropdownOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{subjectFilter || "Materia"}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {subjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-20">
                <button
                  onClick={() => { setSubjectFilter(""); setSubjectDropdownOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors rounded-t-lg"
                >
                  Todas
                </button>
                {uniqueSubjects.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSubjectFilter(s); setSubjectDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${subjectFilter === s ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Materia" sortKey="subject" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Grado" sortKey="grade" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Sección" sortKey="section" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Profesor" sortKey="teacher" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Estudiantes" sortKey="students" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Horario" sortKey="schedule" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedItems.map((classItem) => (
                <tr key={classItem.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{classItem.subject}</span></td>
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{classItem.grade}</span></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-[#1e293b]">{classItem.section}</span></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-[#64748b]">{classItem.teacher}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className="text-sm text-[#1e293b]">{classItem.students}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className="text-sm text-[#64748b]">{classItem.schedule}</span></td>
                  <td className="px-6 py-4">{getStatusBadge(classItem.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Link to={`/clases/${classItem.id}`} className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors flex items-center gap-1"><Eye className="w-4 h-4" /> Ver</Link>
                      {!isProfesor && <button onClick={() => handleOpenEdit(classItem)} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"><Edit className="w-4 h-4" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-[#f8fafc]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#64748b]">
              Mostrando <span className="text-[#1e293b]">{filtered.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filtered.length)}</span> de <span className="text-[#1e293b]">{filtered.length}</span> clases
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {getPageNumbers().map((page, idx) =>
                page === "..." ? (
                  <span key={`dots-${idx}`} className="px-2 py-1.5 text-sm text-[#64748b]">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={
                      safePage === page
                        ? "px-3 py-1.5 rounded-lg bg-[#2563eb] text-white text-sm"
                        : "px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                    }
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Crear Clase" size="md">
        <form onSubmit={handleCreateSubmit}>
          {formFields}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Crear Clase
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingId(null); }} title="Editar Clase" size="md">
        <form onSubmit={handleEditSubmit}>
          {formFields}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => { setEditModalOpen(false); setEditingId(null); }}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
