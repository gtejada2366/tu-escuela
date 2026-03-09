import { useState } from "react";
import { Badge } from "../components/Badge";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { Search, Filter, ChevronDown, Save, Download, X, TrendingUp, Award, AlertCircle, BarChart3, FileText } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGradesData, type GradeStudent } from "../hooks/useGradesData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";

type Student = GradeStudent;

export function Calificaciones() {
  const { showToast } = useToast();
  const { schoolName } = useSchoolConfig();
  const {
    availableClasses: classesData,
    selectedClass,
    setSelectedClass,
    studentsData,
    updateGrade: handleGradeChange,
    saveGrades,
    exportCSV: handleExportCSV,
    courseStats,
    loading,
  } = useGradesData();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [gradeRangeFilter, setGradeRangeFilter] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  if (loading) return <LoadingSpinner />;

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
    const rows = studentsData.map(s =>
      `<tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">${s.name}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">${s.exam1}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">${s.exam2}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">${s.homework}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0">${s.participation}</td><td style="padding:8px;text-align:center;border-bottom:1px solid #e2e8f0;font-weight:600">${s.average}</td></tr>`
    ).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Calificaciones - ${selectedClass.name}</title><style>body{font-family:system-ui,sans-serif;padding:40px;color:#1e293b}h1{font-size:20px;margin-bottom:4px}p{font-size:14px;color:#64748b;margin-bottom:20px}table{width:100%;border-collapse:collapse}th{background:#f8fafc;padding:10px 8px;text-align:center;font-size:12px;text-transform:uppercase;color:#64748b;border-bottom:2px solid #e2e8f0}th:first-child{text-align:left}td{font-size:14px}@media print{body{padding:20px}}</style></head><body><h1>${schoolName} — Reporte de Calificaciones</h1><p>${selectedClass.name} | Generado: ${new Date().toLocaleDateString("es-PE")}</p><table><thead><tr><th>Estudiante</th><th>Examen 1</th><th>Examen 2</th><th>Tarea</th><th>Participación</th><th>Promedio</th></tr></thead><tbody>${rows}</tbody></table><p style="margin-top:24px;font-size:12px;color:#94a3b8">Promedio general: ${courseStats.average} | Nota más alta: ${courseStats.highest} | Nota más baja: ${courseStats.lowest}</p></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const handleSave = async () => {
    await saveGrades();
    showToast("Calificaciones guardadas exitosamente");
  };

  const filteredStudents = studentsData.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    let matchesGradeRange = true;
    if (gradeRangeFilter === "excelente") {
      matchesGradeRange = student.average >= 18 && student.average <= 20;
    } else if (gradeRangeFilter === "bueno") {
      matchesGradeRange = student.average >= 16 && student.average < 18;
    } else if (gradeRangeFilter === "regular") {
      matchesGradeRange = student.average >= 14 && student.average < 16;
    } else if (gradeRangeFilter === "bajo") {
      matchesGradeRange = student.average < 14;
    }
    return matchesSearch && matchesGradeRange;
  });

  const sortedStudents = sortData(filteredStudents, sortKey, sortDir);

  const distribution = [
    { range: "18-20", count: studentsData.filter(s => s.average >= 18).length },
    { range: "16-17", count: studentsData.filter(s => s.average >= 16 && s.average < 18).length },
    { range: "14-15", count: studentsData.filter(s => s.average >= 14 && s.average < 16).length },
    { range: "0-13", count: studentsData.filter(s => s.average < 14).length },
  ];

  const filterOptions = [
    { label: "Todos", value: "" },
    { label: "Excelente (18-20)", value: "excelente" },
    { label: "Bueno (16-17)", value: "bueno" },
    { label: "Regular (14-15)", value: "regular" },
    { label: "Bajo (0-13)", value: "bajo" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Calificaciones</h1>
          <p className="text-sm text-[#64748b]">Gestiona las notas de tus estudiantes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSVLocal} className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handleExportPDF} className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm">
            <Save className="w-4 h-4" /> Guardar
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
            <select value={selectedClass.id} onChange={(e) => { const c = classesData.find(c => c.id === parseInt(e.target.value)); if (c) setSelectedClass(c); }} className="px-3 py-2 rounded-lg border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
              {classesData.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
            <input type="text" placeholder="Buscar estudiante..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
          </div>
          <div className="relative">
            <button onClick={() => setShowFilterDropdown(!showFilterDropdown)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors">
              <Filter className="w-4 h-4 text-[#64748b]" /><span className="text-sm text-[#1e293b]">{gradeRangeFilter ? filterOptions.find(f => f.value === gradeRangeFilter)?.label : "Filtros"}</span><ChevronDown className="w-4 h-4 text-[#64748b]" />
            </button>
            {showFilterDropdown && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-lg border border-border shadow-lg z-20">
                {filterOptions.map(option => (
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

      <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Estudiante" sortKey="name" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="left" className="sticky left-0 bg-[#f8fafc] z-10" />
                <SortableHeader label="Examen 1" sortKey="exam1" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Examen 2" sortKey="exam2" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Tarea" sortKey="homework" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
                <SortableHeader label="Participación" sortKey="participation" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" className="hidden sm:table-cell" />
                <SortableHeader label="Promedio" sortKey="average" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} align="center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedStudents.map((student) => (
                <tr key={student.id} className="hover:bg-[#f8fafc] transition-colors cursor-pointer" onClick={() => setSelectedStudent(student)}>
                  <td className="px-4 py-3 sticky left-0 bg-white hover:bg-[#f8fafc] z-10"><span className="text-sm text-[#1e293b]">{student.name}</span></td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" value={student.exam1} onChange={(e) => { e.stopPropagation(); handleGradeChange(student.id, 'exam1', e.target.value); }} onClick={(e) => e.stopPropagation()} min="0" max="20" className={`w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${getGradeColor(student.exam1)}`} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" value={student.exam2} onChange={(e) => { e.stopPropagation(); handleGradeChange(student.id, 'exam2', e.target.value); }} onClick={(e) => e.stopPropagation()} min="0" max="20" className={`w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${getGradeColor(student.exam2)}`} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <input type="number" value={student.homework} onChange={(e) => { e.stopPropagation(); handleGradeChange(student.id, 'homework', e.target.value); }} onClick={(e) => e.stopPropagation()} min="0" max="20" className={`w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${getGradeColor(student.homework)}`} />
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <input type="number" value={student.participation} onChange={(e) => { e.stopPropagation(); handleGradeChange(student.id, 'participation', e.target.value); }} onClick={(e) => e.stopPropagation()} min="0" max="20" className={`w-16 px-2 py-1 text-center rounded border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb] ${getGradeColor(student.participation)}`} />
                  </td>
                  <td className="px-4 py-3 text-center"><span className={`text-base ${getGradeColor(student.average)}`}>{student.average}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Distribución de Calificaciones</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={distribution}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="range" stroke="#64748b" style={{ fontSize: '12px' }} />
            <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
            <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

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
                <h3 className="text-base text-[#1e293b] mb-4">Evolución de Notas</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={selectedStudent.grades}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="week" stroke="#64748b" style={{ fontSize: '12px' }} />
                    <YAxis domain={[0, 20]} stroke="#64748b" style={{ fontSize: '12px' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                    <Line type="monotone" dataKey="grade" stroke="#2563eb" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3 className="text-base text-[#1e293b] mb-4">Desglose</h3>
                <div className="space-y-3">
                  {[{ label: "Examen 1", value: selectedStudent.exam1 }, { label: "Examen 2", value: selectedStudent.exam2 }, { label: "Tarea", value: selectedStudent.homework }, { label: "Participación", value: selectedStudent.participation }].map(item => (
                    <div key={item.label} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg">
                      <span className="text-sm text-[#64748b]">{item.label}</span>
                      <span className={`text-sm ${getGradeColor(item.value)}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
