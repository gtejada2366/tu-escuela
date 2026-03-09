import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Search, Filter, Plus, ChevronDown } from "lucide-react";
import { useProfesoresData, SUBJECTS, GRADES, type Professor } from "../hooks/useProfesoresData";
import { isValidPhone } from "../lib/validation";
import { LoadingSpinner } from "../components/LoadingSpinner";

const ITEMS_PER_PAGE = 8;

export function Profesores() {
  const { showToast } = useToast();
  const { professors, loading, error, addProfessor, updateProfessor, removeProfessor } = useProfesoresData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);

  // Search & filters
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Todos");

  // Dropdown visibility
  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  // Refs for closing dropdowns on outside click
  const subjectDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Sort state
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingProfessor, setDeletingProfessor] = useState<Professor | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formSubjects, setFormSubjects] = useState<string[]>([]);
  const [formGrades, setFormGrades] = useState<string[]>([]);
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");

  // Dropdown open state
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [gradesOpen, setGradesOpen] = useState(false);
  const subjectsRef = useRef<HTMLDivElement>(null);
  const gradesRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (subjectsRef.current && !subjectsRef.current.contains(e.target as Node)) setSubjectsOpen(false);
      if (gradesRef.current && !gradesRef.current.contains(e.target as Node)) setGradesOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target as Node)) {
        setSubjectDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setStatusDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, subjectFilter, statusFilter]);

  if (loading) return <LoadingSpinner />;

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  // Filtering logic
  const filtered = professors.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === "" || p.subject === subjectFilter;
    const matchesStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Activo" && p.status === "active") ||
      (statusFilter === "Inactivo" && p.status === "inactive");
    return matchesSearch && matchesSubject && matchesStatus;
  });

  // Sort filtered data
  const sorted = sortData(filtered, sortKey, sortDir);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedProfessors = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showingFrom = sorted.length === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + ITEMS_PER_PAGE, sorted.length);

  // Generate page numbers to display
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Activo</Badge>;
      case "inactive": return <Badge variant="neutral">Inactivo</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  // Open modal for adding
  const handleOpenAdd = () => {
    setEditingProfessor(null);
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormSubjects([]);
    setFormGrades([]);
    setFormPhone("");
    setFormAddress("");
    setFormStatus("active");
    setModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (professor: Professor) => {
    setEditingProfessor(professor);
    setFormName(professor.name);
    setFormSubjects(professor.subject.split(", ").filter(Boolean));
    setFormGrades(professor.grades.split(", ").filter(Boolean));
    setFormPhone(professor.phone);
    setFormAddress(professor.address);
    setFormStatus(professor.status);
    setModalOpen(true);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast("El nombre es obligatorio", "error");
      return;
    }
    if (formSubjects.length === 0) {
      showToast("Selecciona al menos una materia", "error");
      return;
    }
    if (formGrades.length === 0) {
      showToast("Selecciona al menos un grado", "error");
      return;
    }

    if (formPhone && !isValidPhone(formPhone)) {
      showToast("Formato de teléfono no válido", "error");
      return;
    }

    const subjectStr = formSubjects.join(", ");
    const gradesStr = formGrades.join(", ");

    if (editingProfessor) {
      try {
        await updateProfessor(editingProfessor.id, {
          name: formName.trim(),
          subject: subjectStr,
          grades: gradesStr,
          phone: formPhone.trim(),
          address: formAddress.trim(),
          status: formStatus,
        });
        showToast("Profesor actualizado correctamente", "success");
      } catch {
        showToast("Error al guardar. Intenta de nuevo.", "error");
        return;
      }
    } else {
      if (!formEmail.trim() || !formPassword.trim()) {
        showToast("El correo y la contraseña son obligatorios", "error");
        return;
      }
      if (formPassword.trim().length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres", "error");
        return;
      }
      try {
        await addProfessor({
          name: formName.trim(),
          email: formEmail.trim(),
          password: formPassword.trim(),
          subject: subjectStr,
          grades: gradesStr,
          phone: formPhone.trim(),
          address: formAddress.trim(),
          status: formStatus,
        });
        showToast("Profesor agregado correctamente", "success");
      } catch (err) {
        showToast(err instanceof Error ? err.message : "Error al guardar. Intenta de nuevo.", "error");
        return;
      }
    }

    setModalOpen(false);
  };

  const handleOpenDelete = (professor: Professor) => {
    setDeletingProfessor(professor);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingProfessor) return;
    try {
      await removeProfessor(deletingProfessor.id);
      showToast("Profesor eliminado exitosamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowDeleteModal(false);
    setDeletingProfessor(null);
  };

  // Subject filter label
  const subjectLabel = subjectFilter || "Materia";
  const statusLabel = statusFilter === "Todos" ? "Estado" : statusFilter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Profesores</h1>
          <p className="text-sm text-[#64748b]">Gestiona todos los docentes del colegio</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Profesor
        </button>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input
              type="text"
              placeholder="Buscar por nombre, materia o grado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>

          {/* Subject filter dropdown */}
          <div className="relative" ref={subjectDropdownRef}>
            <button
              onClick={() => {
                setSubjectDropdownOpen((prev) => !prev);
                setStatusDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{subjectLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {subjectDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg border border-border shadow-lg z-10">
                <button
                  onClick={() => {
                    setSubjectFilter("");
                    setSubjectDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors rounded-t-lg ${subjectFilter === "" ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                >
                  Todas las materias
                </button>
                {SUBJECTS.map((subject, idx) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setSubjectFilter(subject);
                      setSubjectDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${idx === SUBJECTS.length - 1 ? "rounded-b-lg" : ""} ${subjectFilter === subject ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                  >
                    {subject}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status filter dropdown */}
          <div className="relative" ref={statusDropdownRef}>
            <button
              onClick={() => {
                setStatusDropdownOpen((prev) => !prev);
                setSubjectDropdownOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{statusLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {statusDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-white rounded-lg border border-border shadow-lg z-10">
                {["Todos", "Activo", "Inactivo"].map((option, idx) => (
                  <button
                    key={option}
                    onClick={() => {
                      setStatusFilter(option);
                      setStatusDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === 2 ? "rounded-b-lg" : ""} ${statusFilter === option ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                  >
                    {option}
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
                <SortableHeader label="Profesor" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Materia" sortKey="subject" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Grados" sortKey="grades" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="N° de Clases" sortKey="classes" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Estado" sortKey="status" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <th className="px-6 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedProfessors.map((professor) => (
                <tr key={professor.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
                        <span className="text-sm text-[#2563eb]">{professor.avatar}</span>
                      </div>
                      <span className="text-sm text-[#1e293b]">{professor.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{professor.subject}</span></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-[#64748b]">{professor.grades}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className="text-sm text-[#1e293b]">{professor.classes}</span></td>
                  <td className="px-6 py-4">{getStatusBadge(professor.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/profesores/${professor.uid ?? professor.id}`} className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Ver</Link>
                      <button onClick={() => handleOpenEdit(professor)} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Editar</button>
                      <button onClick={() => handleOpenDelete(professor)} className="text-sm text-[#dc2626] hover:text-[#b91c1c] transition-colors">Eliminar</button>
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
              Mostrando <span className="text-[#1e293b]">{filtered.length === 0 ? "0" : `${showingFrom}-${showingTo}`}</span> de <span className="text-[#1e293b]">{filtered.length}</span> profesores
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={
                    page === safePage
                      ? "px-3 py-1.5 rounded-lg bg-[#2563eb] text-white text-sm"
                      : "px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                  }
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProfessor ? "Editar Profesor" : "Agregar Profesor"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Carlos Mendoza Ruiz"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>

          {!editingProfessor && (
            <>
              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Correo electrónico</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="profesor@correo.edu.pe"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Contraseña</label>
                <input
                  type="password"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>
            </>
          )}

          <div ref={subjectsRef}>
            <label className="block text-sm text-[#1e293b] mb-1">Materias</label>
            <button
              type="button"
              onClick={() => { setSubjectsOpen((v) => !v); setGradesOpen(false); }}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] flex items-center justify-between"
            >
              <span className={formSubjects.length ? "text-[#1e293b]" : "text-[#94a3b8]"}>
                {formSubjects.length ? formSubjects.join(", ") : "Seleccionar materias..."}
              </span>
              <ChevronDown className="w-4 h-4 text-[#64748b] shrink-0" />
            </button>
            {subjectsOpen && (
              <div className="mt-1 w-full bg-white rounded-lg border border-border shadow-lg z-20 max-h-48 overflow-y-auto">
                {SUBJECTS.map((subject) => (
                  <label key={subject} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f8fafc] cursor-pointer text-sm text-[#1e293b]">
                    <input
                      type="checkbox"
                      checked={formSubjects.includes(subject)}
                      onChange={() => setFormSubjects((prev) =>
                        prev.includes(subject) ? prev.filter((s) => s !== subject) : [...prev, subject]
                      )}
                      className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    {subject}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div ref={gradesRef}>
            <label className="block text-sm text-[#1e293b] mb-1">Grados</label>
            <button
              type="button"
              onClick={() => { setGradesOpen((v) => !v); setSubjectsOpen(false); }}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white text-left text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] flex items-center justify-between"
            >
              <span className={formGrades.length ? "text-[#1e293b]" : "text-[#94a3b8]"}>
                {formGrades.length ? formGrades.join(", ") : "Seleccionar grados..."}
              </span>
              <ChevronDown className="w-4 h-4 text-[#64748b] shrink-0" />
            </button>
            {gradesOpen && (
              <div className="mt-1 w-full bg-white rounded-lg border border-border shadow-lg z-20 max-h-48 overflow-y-auto">
                {GRADES.map((grade) => (
                  <label key={grade} className="flex items-center gap-2 px-4 py-2 hover:bg-[#f8fafc] cursor-pointer text-sm text-[#1e293b]">
                    <input
                      type="checkbox"
                      checked={formGrades.includes(grade)}
                      onChange={() => setFormGrades((prev) =>
                        prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
                      )}
                      className="rounded border-[#e2e8f0] text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    {grade}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Teléfono</label>
            <input type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Ej: +51 987 654 321" className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Dirección</label>
            <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Ej: Av. Los Pinos 456, San Isidro" className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>

          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Estado</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              {editingProfessor ? "Guardar Cambios" : "Agregar Profesor"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeletingProfessor(null); }} title="Eliminar Profesor" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#fee2e2] flex items-center justify-center mb-4">
            <span className="text-xl">!</span>
          </div>
          <p className="text-sm text-[#64748b] mb-6">
            ¿Estás seguro de que deseas eliminar a <span className="text-[#1e293b] font-medium">{deletingProfessor?.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowDeleteModal(false); setDeletingProfessor(null); }} className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors">Cancelar</button>
            <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-[#dc2626] text-white text-sm hover:bg-[#b91c1c] transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
