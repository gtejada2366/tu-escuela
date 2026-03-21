import { useState } from "react";
import { Link } from "react-router";
import { Search, ChevronDown, ChevronRight, Users } from "lucide-react";
import { useGradosData, type GradeGroup } from "../hooks/useGradosData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";

function getLevelLabel(grade: string): string {
  if (grade.includes("años")) return "Inicial";
  if (grade.includes("Primaria")) return "Primaria";
  if (grade.includes("Secundaria")) return "Secundaria";
  return "Otro";
}

function getLevelColor(level: string): string {
  switch (level) {
    case "Inicial": return "bg-[#fef3c7] text-[#92400e]";
    case "Primaria": return "bg-[#dbeafe] text-[#1e40af]";
    case "Secundaria": return "bg-[#ede9fe] text-[#5b21b6]";
    default: return "bg-[#f1f5f9] text-[#475569]";
  }
}

export function Grados() {
  const { showToast } = useToast();
  const { isProfesor } = useAuth();
  const { grades, loading, error } = useGradosData();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());

  if (error) showToast(error, "error");
  if (loading) return <LoadingSpinner />;

  const toggleGrade = (grade: string) => {
    setExpandedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  const expandAll = () => setExpandedGrades(new Set(grades.map((g) => g.grade)));
  const collapseAll = () => setExpandedGrades(new Set());

  // Filter by search term (matches grade name or student name)
  const filtered: GradeGroup[] = searchTerm.trim()
    ? grades.map((g) => {
        const term = searchTerm.toLowerCase();
        const gradeMatches = g.grade.toLowerCase().includes(term);
        if (gradeMatches) return g;
        // Filter sections/students
        const sections = g.sections.map((s) => ({
          ...s,
          students: s.students.filter((st) => st.name.toLowerCase().includes(term)),
        })).filter((s) => s.students.length > 0);
        if (sections.length === 0) return null;
        return { ...g, sections, totalStudents: sections.reduce((sum, s) => sum + s.students.length, 0) };
      }).filter(Boolean) as GradeGroup[]
    : grades;

  // Group by level
  const levels = new Map<string, GradeGroup[]>();
  for (const g of filtered) {
    const level = getLevelLabel(g.grade);
    if (!levels.has(level)) levels.set(level, []);
    levels.get(level)!.push(g);
  }

  const totalStudents = filtered.reduce((sum, g) => sum + g.totalStudents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Grados</h1>
          <p className="text-sm text-[#64748b]">
            {isProfesor ? "Grados donde tienes clases asignadas" : "Todos los grados del colegio"}
            {" — "}{filtered.length} grado{filtered.length !== 1 && "s"}, {totalStudents} estudiante{totalStudents !== 1 && "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-[#f8fafc] transition-colors text-[#64748b]"
          >
            Expandir todo
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-[#f8fafc] transition-colors text-[#64748b]"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 border border-border shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
          <input
            type="text"
            placeholder="Buscar por grado o nombre de estudiante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-border shadow-sm p-12 text-center">
          <Users className="w-12 h-12 text-[#cbd5e1] mx-auto mb-4" />
          <p className="text-[#64748b]">No se encontraron grados</p>
        </div>
      ) : (
        <div className="space-y-6">
          {[...levels.entries()].map(([level, gradeGroups]) => (
            <div key={level}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(level)}`}>
                  {level}
                </span>
                <span className="text-xs text-[#94a3b8]">
                  {gradeGroups.reduce((s, g) => s + g.totalStudents, 0)} estudiantes
                </span>
              </div>

              <div className="space-y-2">
                {gradeGroups.map((g) => {
                  const isExpanded = expandedGrades.has(g.grade);
                  return (
                    <div key={g.grade} className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                      <button
                        onClick={() => toggleGrade(g.grade)}
                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8fafc] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {isExpanded
                            ? <ChevronDown className="w-4 h-4 text-[#64748b]" />
                            : <ChevronRight className="w-4 h-4 text-[#64748b]" />
                          }
                          <span className="text-sm font-medium text-[#1e293b]">{g.grade}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-[#94a3b8]">
                            {g.sections.length} sección{g.sections.length !== 1 && "es"}
                          </span>
                          <span className="text-xs bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-full">
                            {g.totalStudents} estudiante{g.totalStudents !== 1 && "s"}
                          </span>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border">
                          {g.sections.length === 0 ? (
                            <div className="px-5 py-6 text-center text-sm text-[#94a3b8]">
                              No hay estudiantes registrados en este grado
                            </div>
                          ) : (
                            g.sections.map((s) => (
                              <div key={s.section} className="px-5 py-3">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-medium text-[#64748b] uppercase tracking-wider">
                                    Sección {s.section}
                                  </span>
                                  <span className="text-xs text-[#94a3b8]">({s.students.length})</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                                  {s.students.map((st) => (
                                    <Link
                                      key={st.id}
                                      to={`/estudiantes/${st.id}`}
                                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f8fafc] transition-colors group"
                                    >
                                      <div className="w-8 h-8 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
                                        <span className="text-xs text-[#2563eb]">{st.avatar}</span>
                                      </div>
                                      <span className="text-sm text-[#1e293b] group-hover:text-[#2563eb] transition-colors truncate">
                                        {st.name}
                                      </span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
