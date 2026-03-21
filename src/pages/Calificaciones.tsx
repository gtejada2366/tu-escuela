import { useState, useEffect } from "react";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Search, Filter, ChevronDown, Save, Download, X, TrendingUp, Award, AlertCircle, BarChart3, FileText, Settings, Plus, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGradesData, DEFAULT_GRADE_CONFIG, type GradeStudent, type GradeColumnConfig } from "../hooks/useGradesData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";

export function Calificaciones() {
  const { showToast } = useToast();
  const { schoolName } = useSchoolConfig();
  const {
    availableClasses: classesData,
    selectedClass,
    setSelectedClass,
    gradeConfig,
    studentsData,
    updateGrade: handleGradeChange,
    saveGrades,
    saveConfig,
    exportCSV: handleExportCSV,
    courseStats,
    loading,
    error,
  } = useGradesData();
  const [selectedStudent, setSelectedStudent] = useState<GradeStudent | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [gradeRangeFilter, setGradeRangeFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Config modal state
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [editConfig, setEditConfig] = useState<GradeColumnConfig[]>([]);

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);

  if (loading) return <LoadingSpinner />;

  if (!selectedClass) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Calificaciones</h1>
          <p className="text-sm text-[#64748b]">Gestiona las notas de tus estudiantes</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
          <BarChart3 className="w-12 h-12 text-[#cbd5e1] mx-auto mb-4" />
          <p className="text-[#64748b]">No hay clases disponibles</p>
          <p className="text-sm text-[#94a3b8] mt-1">Primero necesitas tener clases asignadas para gestionar calificaciones</p>
        </div>
      </div>
    );
  }

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 17) return "text-[#10b981]";
    if (grade >= 14) return "text-[#f59e0b]";
    return "text-[#dc2626]";
  };

  const getGradeBadge = (grade: number) => {
    if (grade >= 17) return <Badge variant="success">{grade}</Badge>;
    if (grade >= 14) return <Badge variant="warning">{grade}</Badge>;
    return <Badge variant="danger">{grade}</Badge>;
  };

  const handleExportCSVLocal = () => {
    handleExportCSV();
    showToast("Calificaciones exportadas en CSV");
  };

  const handleExportPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { showToast("Permite ventanas emergentes para exportar PDF", "error"); return; }
    const colHeaders = gradeConfig.map((c) => `<th style="padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">${c.label}</th>`).join("");
    const rows = studentsData.map((s) => {
      const cells = s.values.map((v) => `<td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">${v}</td>`).join("");
      return `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${s.name}</td>${cells}<td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0;font-weight:600">${s.average}</td></tr>`;
    }).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Calificaciones - ${selectedClass.name}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b}h1{font-size:20px;margin-bottom:4px}p{font-size:14px;color:#64748b;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}th:first-child{text-align:left}td{font-size:14px}@media print{body{padding:20px}}</style></head><body><h1>${schoolName} — Reporte de Calificaciones</h1><p>${selectedClass.name} | Generado: ${new Date().toLocaleDateString("es-PE")}</p><table><thead><tr><th style="text-align:left">Estudiante</th>${colHeaders}<th style="padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0">Promedio</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:24px;font-size:12px;color:#94a3b8">Promedio general: ${courseStats.average} | Nota más alta: ${courseStats.highest} | Nota más baja: ${courseStats.lowest}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = async () => {
    try {
      await saveGrades();
      showToast("Calificaciones guardadas exitosamente");
    } catch {
      showToast("Error al guardar calificaciones. Intenta de nuevo.", "error");
    }
  };

  // Config modal handlers
  const handleOpenConfig = () => {
    setEditConfig(gradeConfig.map((c) => ({ ...c })));
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (editConfig.length === 0) {
      showToast("Debe haber al menos una columna", "error");
      return;
    }
    for (const c of editConfig) {
      if (!c.label.trim()) {
        showToast("Todas las columnas deben tener un nombre", "error");
        return;
      }
      if (c.weight <= 0) {
        showToast("Todos los pesos deben ser mayores a 0", "error");
        return;
      }
    }
    try {
      await saveConfig(editConfig);
      showToast("Configuración guardada");
      setShowConfigModal(false);
    } catch {
      showToast("Error al guardar configuración", "error");
    }
  };

  const handleResetConfig = () => {
    setEditConfig(DEFAULT_GRADE_CONFIG.map((c) => ({ ...c })));
  };

  // Filtering
  const filteredStudents = studentsData.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesGradeRange = true;
    if (gradeRangeFilter === "excelente") matchesGradeRange = student.average >= 18 && student.average <= 20;
    else if (gradeRangeFilter === "bueno") matchesGradeRange = student.average >= 16 && student.average < 18;
    else if (gradeRangeFilter === "regular") matchesGradeRange = student.average >= 14 && student.average < 16;
    else if (gradeRangeFilter === "bajo") matchesGradeRange = student.average < 14;
    return matchesSearch && matchesGradeRange;
  });

  // Augment students with col_N keys for sorting
  const augmented = filteredStudents.map((s) => {
    const obj: Record<string, unknown> = { ...s };
    gradeConfig.forEach((_, i) => { obj[`col_${i}`] = s.values[i] ?? 0; });
    return obj as GradeStudent & Record<string, unknown>;
  });
  const sortedStudents = sortData(augmented, sortKey, sortDir) as GradeStudent[];

  const distribution = [
    { range: "18-20", count: studentsData.filter((s) => s.average >= 18).length },
    { range: "16-17", count: studentsData.filter((s) => s.average >= 16 && s.average < 18).length },
    { range: "14-15", count: studentsData.filter((s) => s.average >= 14 && s.average < 16).length },
    { range: "0-13", count: studentsData.filter((s) => s.average < 14).length },
  ];

  const filterOptions = [
    { label: "Todos", value: "" },
    { label: "Excelente (18-20)", value: "excelente" },
    { label: "Bueno (16-17)", value: "bueno" },
    { label: "Regular (14-15)", value: "regular" },
    { label: "Bajo (0-13)", value: "bajo" },
  ];

  // Weight display: show percentage of each column
  const totalWeight = gradeConfig.reduce((sum, c) => sum + c.weight, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Calificaciones</h1>
          <p className="text-sm text-[#64748b]">Gestiona las notas de tus estudiantes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleOpenConfig} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]" title="Configurar columnas" aria-label="Configurar columnas">
            <Settings className="w-4 h-4" /> <span className="hidden sm:inline">Columnas</span>
          </button>
          <button onClick={handleExportCSVLocal} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]" aria-label="Exportar CSV">
            <Download className="w-4 h-4" /> <span className="hidden sm:inline">CSV</span>
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 sm:px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]" aria-label="Exportar PDF">
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm" aria-label="Guardar calificaciones">
            <Save className="w-4 h-4" /> <span className="hidden sm:inline">Guardar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><BarChart3 className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Promedio</p></div>
          <p className={`text-2xl ${getGradeColor(courseStats.average)}`}>{courseStats.average}</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#dcfce7] flex items-center justify-center"><Award className="w-5 h-5 text-[#10b981]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Más Alta</p></div>
          <p className="text-2xl text-[#10b981]">{courseStats.highest}</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#fee2e2] flex items-center justify-center"><AlertCircle className="w-5 h-5 text-[#dc2626]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Más Baja</p></div>
          <p className="text-2xl text-[#dc2626]">{courseStats.lowest}</p>
        </div>
        <div className="bg-white rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-[#eff6ff] flex items-center justify-center"><TrendingUp className="w-5 h-5 text-[#2563eb]" /></div><p className="text-xs text-[#64748b] uppercase tracking-wider">Estudiantes</p></div>
          <p className="text-2xl text-[#1e293b]">{studentsData.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#64748b]">Clase:</span>
            <select value={selectedClass.id} onChange={(e) => { const c = classesData.find((c) => c.id === parseInt(e.target.value)); if (c) setSelectedClass(c); }} className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
              {classesData.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors">
              <Filter className="w-4 h-4 text-[#64748b]" /><span className="text-sm text-[#1e293b]">{gradeRangeFilter ? filterOptions.find((f) => f.value === gradeRangeFilter)?.label : "Filtros"}</span><ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg border border-border shadow-lg z-20">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => { setGradeRangeFilter(option.value); setShowFilterDropdown(false); }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#f8fafc] transition-colors first:rounded-t-lg last:rounded-b-lg ${gradeRangeFilter === option.value ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#1e293b]"}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Estudiante" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="left" className="sticky left-0 bg-[#f8fafc] z-10" />
                {gradeConfig.map((col, i) => (
                  <th key={i} className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleSort(`col_${i}`)}
                      className="text-xs text-[#64748b] uppercase tracking-wider hover:text-[#1e293b] transition-colors"
                    >
                      <div>{col.label}</div>
                      {totalWeight > 0 && (
                        <div className="text-[10px] text-[#94a3b8] font-normal normal-case">
                          {((col.weight / totalWeight) * 100).toFixed(0)}%
                        </div>
                      )}
                    </button>
                  </th>
                ))}
                <SortableHeader label="Promedio" sortKey="average" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={gradeConfig.length + 2} className="px-4 py-12 text-center text-sm text-[#94a3b8]">
                    No hay estudiantes matriculados en esta clase
                  </td>
                </tr>
              ) : (
                sortedStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => setSelectedStudent(student)}>
                    <td className="px-4 py-3 sticky left-0 bg-white hover:bg-[#f8fafc] z-10"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                    {gradeConfig.map((_, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={student.values[i] ?? 0}
                          onChange={(e) => { e.stopPropagation(); handleGradeChange(student.id, i, e.target.value); }}
                          onClick={(e) => e.stopPropagation()}
                          min="0"
                          max="20"
                          className={`w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${getGradeColor(student.values[i] ?? 0)}`}
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center"><span className={`text-base ${getGradeColor(student.average)}`}>{student.average}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Distribución de Calificaciones</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="range" stroke="#64748b" style={{ fontSize: "12px" }} />
            <YAxis stroke="#64748b" style={{ fontSize: "12px" }} />
            <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: "12px" }} />
            <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Student Detail Sidebar */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-end">
          <div className="w-full max-w-lg h-full bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-6 z-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl text-[#1e293b]">Detalle del Estudiante</h2>
                <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-[#f8fafc] rounded-lg transition-colors"><X className="w-5 h-5 text-[#64748b]" /></button>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg text-[#1e293b]">{selectedStudent.name}</h3>
                <p className="text-sm text-[#64748b]">{selectedClass.name}</p>
                <div className="flex items-center gap-2"><span className="text-sm text-[#64748b]">Promedio:</span>{getGradeBadge(selectedStudent.average)}</div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-base text-[#1e293b] mb-4">Desglose</h3>
                <div className="space-y-3">
                  {gradeConfig.map((col, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                      <div>
                        <span className="text-sm text-[#64748b]">{col.label}</span>
                        {totalWeight > 0 && (
                          <span className="text-xs text-[#94a3b8] ml-2">({((col.weight / totalWeight) * 100).toFixed(0)}%)</span>
                        )}
                      </div>
                      <span className={`text-sm ${getGradeColor(selectedStudent.values[i] ?? 0)}`}>{selectedStudent.values[i] ?? 0}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Config Modal */}
      <Modal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} title="Configurar Columnas de Calificación" size="md">
        <div className="space-y-4">
          <p className="text-sm text-[#64748b]">Define las columnas y el peso de cada una para el cálculo del promedio.</p>

          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_80px_40px] gap-2 text-xs text-[#64748b] uppercase tracking-wider px-1">
              <span>Nombre</span>
              <span className="text-center">Peso</span>
              <span />
            </div>
            {editConfig.map((col, i) => (
              <div key={i} className="grid grid-cols-[1fr_80px_40px] gap-2 items-center">
                <input
                  type="text"
                  value={col.label}
                  onChange={(e) => {
                    const updated = [...editConfig];
                    updated[i] = { ...updated[i], label: e.target.value };
                    setEditConfig(updated);
                  }}
                  placeholder="Nombre de columna"
                  className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
                <input
                  type="number"
                  value={col.weight}
                  onChange={(e) => {
                    const updated = [...editConfig];
                    updated[i] = { ...updated[i], weight: Math.max(0, parseFloat(e.target.value) || 0) };
                    setEditConfig(updated);
                  }}
                  min="0"
                  step="0.5"
                  className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#2563eb]"
                />
                <button
                  onClick={() => {
                    if (editConfig.length <= 1) return;
                    setEditConfig(editConfig.filter((_, j) => j !== i));
                  }}
                  disabled={editConfig.length <= 1}
                  className="p-2 rounded-lg hover:bg-[#fee2e2] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Eliminar columna"
                >
                  <Trash2 className="w-4 h-4 text-[#dc2626]" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={() => setEditConfig([...editConfig, { label: "", weight: 1 }])}
            className="flex items-center gap-2 text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar columna
          </button>

          {/* Preview weights */}
          {editConfig.length > 0 && (
            <div className="p-3 bg-[#f8fafc] rounded-lg">
              <p className="text-xs text-[#64748b] mb-2">Vista previa de pesos:</p>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const tw = editConfig.reduce((s, c) => s + c.weight, 0);
                  return editConfig.map((c, i) => (
                    <span key={i} className="text-xs bg-white px-2 py-1 rounded border border-border text-[#1e293b]">
                      {c.label || `Col ${i + 1}`}: {tw > 0 ? ((c.weight / tw) * 100).toFixed(0) : 0}%
                    </span>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleResetConfig}
              className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
            >
              Restaurar predeterminado
            </button>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-lg border border-border bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
