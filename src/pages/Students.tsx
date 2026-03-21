import { useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Search, Filter, Plus, ChevronDown, Upload, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { useStudentsData, type StudentLocal } from "../hooks/useStudentsData";
import { isValidPhone } from "../lib/validation";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { parseCSV, importCSV, generateTemplateCSV, type CSVRow, type CSVImportResult } from "../lib/csvImport";

type Student = StudentLocal;

export function Students() {
  const { showToast } = useToast();
  const { students, loading, error, addStudent, updateStudent, removeStudent, generateAvatar } = useStudentsData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);
  const [searchTerm, setSearchTerm] = useState("");
  const [gradeFilter, setGradeFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGradeDropdown, setShowGradeDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formGrade, setFormGrade] = useState("");
  const [formSection, setFormSection] = useState("");
  const [formParent, setFormParent] = useState("");
  const [formPaymentStatus, setFormPaymentStatus] = useState("paid");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<Student | null>(null);
  const [formPhone, setFormPhone] = useState("");
  const [formAddress, setFormAddress] = useState("");

  // CSV Import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvRows, setCsvRows] = useState<CSVRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<{ row: number; message: string }[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvResult, setCsvResult] = useState<CSVImportResult | null>(null);

  const gradeDropdownRef = useRef<HTMLDivElement>(null);
  const paymentDropdownRef = useRef<HTMLDivElement>(null);

  const itemsPerPage = 8;

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
        setShowGradeDropdown(false);
      }
      if (paymentDropdownRef.current && !paymentDropdownRef.current.contains(event.target as Node)) {
        setShowPaymentDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case "paid": return <Badge variant="success">Pagado</Badge>;
      case "pending": return <Badge variant="warning">Pendiente</Badge>;
      case "overdue": return <Badge variant="danger">Vencido</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 95) return "text-[#10b981]";
    if (percentage >= 90) return "text-[#f59e0b]";
    return "text-[#dc2626]";
  };

  // All grades grouped by level
  const gradesByLevel = [
    { level: "Inicial", grades: ["3 años", "4 años", "5 años"] },
    { level: "Primaria", grades: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"] },
    { level: "Secundaria", grades: ["1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria"] },
  ];
  // Payment status options
  const paymentOptions = [
    { value: "", label: "Todos" },
    { value: "paid", label: "Pagado" },
    { value: "pending", label: "Pendiente" },
    { value: "overdue", label: "Vencido" },
  ];

  // Filter students
  const filtered = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === "" || s.grade === gradeFilter;
    const matchesPayment = paymentFilter === "" || s.paymentStatus === paymentFilter;
    return matchesSearch && matchesGrade && matchesPayment;
  });

  const sorted = sortData(filtered, sortKey, sortDir);

  // Pagination calculations
  const totalItems = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, gradeFilter, paymentFilter]);

  // Clamp current page
  const safePage = Math.min(currentPage, totalPages);
  if (safePage !== currentPage) {
    setCurrentPage(safePage);
  }

  const startIndex = (safePage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedStudents = sorted.slice(startIndex, endIndex);

  // Page numbers to display (up to 5 pages around current)
  const getPageNumbers = () => {
    const pages: number[] = [];
    let start = Math.max(1, safePage - 2);
    let end = Math.min(totalPages, start + 4);
    start = Math.max(1, end - 4);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const handleAddStudent = async () => {
    if (!formName.trim() || !formGrade || !formSection.trim() || !formParent.trim()) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    if (!isValidPhone(formPhone)) {
      showToast("Formato de teléfono no válido", "error");
      return;
    }

    const newStudent: Student = {
      id: Math.max(0, ...students.map((s) => s.id)) + 1,
      name: formName.trim(),
      grade: formGrade,
      section: formSection.trim(),
      parent: formParent.trim(),
      paymentStatus: formPaymentStatus,
      attendance: 100,
      avatar: generateAvatar(formName),
      phone: formPhone.trim() || "-",
      address: formAddress.trim() || "-",
    };

    try {
      await addStudent(newStudent);
      showToast("Estudiante agregado exitosamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowAddModal(false);
    setFormName("");
    setFormGrade("");
    setFormSection("");
    setFormParent("");
    setFormPaymentStatus("paid");
    setFormPhone("");
    setFormAddress("");
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormName(student.name);
    setFormGrade(student.grade);
    setFormSection(student.section);
    setFormParent(student.parent);
    setFormPaymentStatus(student.paymentStatus);
    setFormPhone(student.phone);
    setFormAddress(student.address);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent || !formName.trim() || !formGrade || !formSection.trim() || !formParent.trim()) {
      showToast("Por favor completa todos los campos", "error");
      return;
    }

    if (!isValidPhone(formPhone)) {
      showToast("Formato de teléfono no válido", "error");
      return;
    }

    try {
      await updateStudent(editingStudent.id, {
        name: formName.trim(),
        grade: formGrade,
        section: formSection.trim(),
        parent: formParent.trim(),
        paymentStatus: formPaymentStatus,
        phone: formPhone.trim() || "-",
        address: formAddress.trim() || "-",
      });
      showToast("Estudiante actualizado exitosamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowEditModal(false);
    setEditingStudent(null);
  };

  const handleOpenDelete = (student: Student) => {
    setDeleteStudent(student);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteStudent) return;
    try {
      await removeStudent(deleteStudent.id);
      showToast("Estudiante eliminado exitosamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowDeleteModal(false);
    setDeleteStudent(null);
  };

  const gradeLabel = gradeFilter || "Grado";
  const paymentLabel = paymentFilter
    ? paymentOptions.find((o) => o.value === paymentFilter)?.label || "Estado de Pago"
    : "Estado de Pago";

  const handleCSVFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { rows, errors } = parseCSV(text);
    setCsvRows(rows);
    setCsvErrors(errors);
    setCsvResult(null);
    e.target.value = "";
  };

  const handleCSVImport = async () => {
    setCsvImporting(true);
    const result = await importCSV(csvRows);
    setCsvResult(result);
    setCsvImporting(false);
    if (result.created > 0) {
      showToast(`${result.created} estudiantes importados`, "success");
      // Reload page to refresh the list
      window.location.reload();
    }
  };

  const handleDownloadTemplate = () => {
    const csv = generateTemplateCSV();
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla_estudiantes.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Estudiantes</h1>
          <p className="text-sm text-[#64748b]">Gestiona todos los estudiantes del colegio</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setCsvRows([]); setCsvErrors([]); setCsvResult(null); setShowImportModal(true); }}
            className="flex items-center gap-2 px-3 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
          >
            <Upload className="w-4 h-4" /> <span className="hidden sm:inline">Importar CSV</span>
          </button>
          <button
            onClick={() => {
              setFormName("");
              setFormGrade("");
              setFormSection("");
              setFormParent("");
              setFormPaymentStatus("paid");
              setFormPhone("");
              setFormAddress("");
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Estudiante
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Buscar por nombre, grado o apoderado..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>

          {/* Grade filter dropdown */}
          <div className="relative" ref={gradeDropdownRef}>
            <button
              onClick={() => {
                setShowGradeDropdown((prev) => !prev);
                setShowPaymentDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{gradeLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showGradeDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-border shadow-lg z-20">
                <button
                  onClick={() => { setGradeFilter(""); setShowGradeDropdown(false); }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors rounded-t-lg ${gradeFilter === "" ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                >
                  Todos
                </button>
                {gradesByLevel.map((group) => (
                  <div key={group.level}>
                    <div className="px-4 py-1.5 text-xs text-[#94a3b8] uppercase tracking-wider bg-[#f8fafc]">{group.level}</div>
                    {group.grades.map((grade) => (
                      <button
                        key={grade}
                        onClick={() => { setGradeFilter(grade); setShowGradeDropdown(false); }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${gradeFilter === grade ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment status filter dropdown */}
          <div className="relative" ref={paymentDropdownRef}>
            <button
              onClick={() => {
                setShowPaymentDropdown((prev) => !prev);
                setShowGradeDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors"
            >
              <Filter className="w-4 h-4 text-[#64748b]" />
              <span className="text-sm text-[#1e293b]">{paymentLabel}</span>
              <ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showPaymentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg border border-border shadow-lg z-20">
                {paymentOptions.map((option, idx) => (
                  <button
                    key={option.value}
                    onClick={() => { setPaymentFilter(option.value); setShowPaymentDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors ${idx === 0 ? "rounded-t-lg" : ""} ${idx === paymentOptions.length - 1 ? "rounded-b-lg" : ""} ${paymentFilter === option.value ? "text-[#2563eb] bg-[#eff6ff]" : "text-[#1e293b]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px]">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Estudiante" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Grado" sortKey="grade" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Seccion" sortKey="section" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <SortableHeader label="Apoderado" sortKey="parent" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                <SortableHeader label="Estado de Pago" sortKey="paymentStatus" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} />
                <SortableHeader label="Asistencia" sortKey="attendance" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                <th className="px-3 sm:px-6 py-3 text-left text-xs text-[#64748b] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
                        <span className="text-sm text-[#2563eb]">{student.avatar}</span>
                      </div>
                      <span className="text-sm text-[#1e293b]">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4"><span className="text-sm text-[#1e293b]">{student.grade}</span></td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className="text-sm text-[#1e293b]">{student.section}</span></td>
                  <td className="px-6 py-4 hidden lg:table-cell"><span className="text-sm text-[#64748b]">{student.parent}</span></td>
                  <td className="px-6 py-4">{getPaymentBadge(student.paymentStatus)}</td>
                  <td className="px-6 py-4 hidden md:table-cell"><span className={`text-sm ${getAttendanceColor(student.attendance)}`}>{student.attendance}%</span></td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                      <Link to={`/estudiantes/${student.id}`} className="text-xs sm:text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Ver</Link>
                      <button onClick={() => handleOpenEdit(student)} className="text-xs sm:text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Editar</button>
                      <button onClick={() => handleOpenDelete(student)} className="text-xs sm:text-sm text-[#dc2626] hover:text-[#b91c1c] transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-[#64748b]">
                    No se encontraron estudiantes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border bg-[#f8fafc]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-[#64748b]">
              Mostrando <span className="text-[#1e293b]">{totalItems === 0 ? 0 : startIndex + 1}-{endIndex}</span> de <span className="text-[#1e293b]">{totalItems}</span> estudiantes
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={safePage <= 1}
                className={`px-3 py-1.5 rounded-lg border border-border bg-white text-sm transition-colors ${safePage <= 1 ? "text-[#cbd5e1] cursor-not-allowed" : "text-[#64748b] hover:bg-[#f8fafc]"}`}
              >
                Anterior
              </button>
              {getPageNumbers().map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${page === safePage ? "bg-[#2563eb] text-white" : "border border-border bg-white text-[#64748b] hover:bg-[#f8fafc]"}`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={safePage >= totalPages}
                className={`px-3 py-1.5 rounded-lg border border-border bg-white text-sm transition-colors ${safePage >= totalPages ? "text-[#cbd5e1] cursor-not-allowed" : "text-[#64748b] hover:bg-[#f8fafc]"}`}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Agregar Estudiante">
        <div className="space-y-4">
          <div>
            <label htmlFor="student-name" className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
            <input
              id="student-name"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: María González Pérez"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label htmlFor="student-grade" className="block text-sm text-[#1e293b] mb-1">Grado</label>
            <select
              id="student-grade"
              value={formGrade}
              onChange={(e) => setFormGrade(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="">Seleccionar grado</option>
              {gradesByLevel.map((group) => (
                <optgroup key={group.level} label={group.level}>
                  {group.grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="student-section" className="block text-sm text-[#1e293b] mb-1">Seccion</label>
            <input
              id="student-section"
              type="text"
              value={formSection}
              onChange={(e) => setFormSection(e.target.value)}
              placeholder="Ej: A"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label htmlFor="student-parent" className="block text-sm text-[#1e293b] mb-1">Nombre del apoderado</label>
            <input
              id="student-parent"
              type="text"
              value={formParent}
              onChange={(e) => setFormParent(e.target.value)}
              placeholder="Ej: Carlos González"
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label htmlFor="student-phone" className="block text-sm text-[#1e293b] mb-1">Teléfono del apoderado</label>
            <input id="student-phone" type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="Ej: +51 987 654 321" className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="student-address" className="block text-sm text-[#1e293b] mb-1">Dirección</label>
            <input id="student-address" type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} placeholder="Ej: Av. Los Olivos 234, San Isidro" className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="student-payment-status" className="block text-sm text-[#1e293b] mb-1">Estado de pago</label>
            <select
              id="student-payment-status"
              value={formPaymentStatus}
              onChange={(e) => setFormPaymentStatus(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAddStudent}
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Student Modal */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditingStudent(null); }} title="Editar Estudiante">
        <div className="space-y-4">
          <div>
            <label htmlFor="edit-student-name" className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
            <input id="edit-student-name" type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="edit-student-grade" className="block text-sm text-[#1e293b] mb-1">Grado</label>
            <select id="edit-student-grade" value={formGrade} onChange={(e) => setFormGrade(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm">
              <option value="">Seleccionar grado</option>
              {gradesByLevel.map((group) => (
                <optgroup key={group.level} label={group.level}>
                  {group.grades.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="edit-student-section" className="block text-sm text-[#1e293b] mb-1">Seccion</label>
            <input id="edit-student-section" type="text" value={formSection} onChange={(e) => setFormSection(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="edit-student-parent" className="block text-sm text-[#1e293b] mb-1">Nombre del apoderado</label>
            <input id="edit-student-parent" type="text" value={formParent} onChange={(e) => setFormParent(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="edit-student-phone" className="block text-sm text-[#1e293b] mb-1">Teléfono del apoderado</label>
            <input id="edit-student-phone" type="text" value={formPhone} onChange={(e) => setFormPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="edit-student-address" className="block text-sm text-[#1e293b] mb-1">Dirección</label>
            <input id="edit-student-address" type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div>
            <label htmlFor="edit-student-payment-status" className="block text-sm text-[#1e293b] mb-1">Estado de pago</label>
            <select id="edit-student-payment-status" value={formPaymentStatus} onChange={(e) => setFormPaymentStatus(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm">
              <option value="paid">Pagado</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencido</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => { setShowEditModal(false); setEditingStudent(null); }} className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors">Cancelar</button>
            <button onClick={handleSaveEdit} className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors">Guardar Cambios</button>
          </div>
        </div>
      </Modal>

      {/* Delete Student Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => { setShowDeleteModal(false); setDeleteStudent(null); }} title="Eliminar Estudiante" size="sm">
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#fee2e2] flex items-center justify-center mb-4">
            <span className="text-xl">!</span>
          </div>
          <p className="text-sm text-[#64748b] mb-6">
            ¿Estás seguro de que deseas eliminar a <span className="text-[#1e293b] font-medium">{deleteStudent?.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowDeleteModal(false); setDeleteStudent(null); }} className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors">Cancelar</button>
            <button onClick={handleConfirmDelete} className="px-4 py-2 rounded-lg bg-[#dc2626] text-white text-sm hover:bg-[#b91c1c] transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>

      {/* CSV Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Importar Estudiantes desde CSV"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-[#2563eb]/40 rounded-lg cursor-pointer hover:bg-[#eff6ff]/50 transition-colors">
              <Upload className="w-5 h-5 text-[#2563eb]" />
              <span className="text-sm text-[#2563eb]">Seleccionar archivo CSV</span>
              <input type="file" accept=".csv" onChange={handleCSVFile} className="hidden" />
            </label>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg hover:bg-[#f8fafc] text-sm text-[#64748b] transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" /> Plantilla
            </button>
          </div>

          <p className="text-xs text-[#94a3b8]">
            Columnas esperadas: nombre, grado, seccion, apoderado, telefono, email_apoderado, direccion
          </p>

          {csvErrors.length > 0 && (
            <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3">
              <p className="text-sm text-[#dc2626] font-medium mb-1 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {csvErrors.length} errores encontrados
              </p>
              <ul className="text-xs text-[#991b1b] space-y-0.5 max-h-24 overflow-y-auto">
                {csvErrors.map((err, i) => (
                  <li key={i}>Fila {err.row}: {err.message}</li>
                ))}
              </ul>
            </div>
          )}

          {csvRows.length > 0 && (
            <>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-48">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-border">
                        <th className="px-3 py-2 text-left text-xs text-[#64748b]">#</th>
                        <th className="px-3 py-2 text-left text-xs text-[#64748b]">Nombre</th>
                        <th className="px-3 py-2 text-left text-xs text-[#64748b]">Grado</th>
                        <th className="px-3 py-2 text-left text-xs text-[#64748b]">Sección</th>
                        <th className="px-3 py-2 text-left text-xs text-[#64748b]">Apoderado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.slice(0, 10).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          <td className="px-3 py-2 text-[#94a3b8]">{i + 1}</td>
                          <td className="px-3 py-2 text-[#1e293b]">{row.nombre}</td>
                          <td className="px-3 py-2 text-[#64748b]">{row.grado}</td>
                          <td className="px-3 py-2 text-[#64748b]">{row.seccion}</td>
                          <td className="px-3 py-2 text-[#64748b]">{row.apoderado || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {csvRows.length > 10 && (
                  <div className="px-3 py-2 bg-[#f8fafc] text-xs text-[#94a3b8] border-t border-border">
                    ...y {csvRows.length - 10} filas más
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-[#1e293b]">
                  <span className="font-medium">{csvRows.length}</span> estudiantes listos para importar
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCSVImport}
                    disabled={csvImporting || csvErrors.length > 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                  >
                    {csvImporting ? "Importando..." : `Importar ${csvRows.length} estudiantes`}
                  </button>
                </div>
              </div>
            </>
          )}

          {csvResult && (
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-4 space-y-2">
              <p className="text-sm text-[#15803d] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {csvResult.created} estudiantes creados exitosamente
              </p>
              {csvResult.failed > 0 && (
                <p className="text-sm text-[#dc2626] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> {csvResult.failed} fallaron
                </p>
              )}
              {csvResult.errors.length > 0 && (
                <ul className="text-xs text-[#991b1b] space-y-0.5">
                  {csvResult.errors.map((err, i) => (
                    <li key={i}>{err.name}: {err.message}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
