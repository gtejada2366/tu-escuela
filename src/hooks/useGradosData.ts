import { useState, useEffect } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { studentsService } from "../services/students.service";
import { classesService } from "../services/classes.service";
import { useAuth } from "../contexts/AuthContext";

export interface GradeGroup {
  grade: string;
  sections: SectionGroup[];
  totalStudents: number;
}

export interface SectionGroup {
  section: string;
  students: GradeStudent[];
}

export interface GradeStudent {
  id: number;
  name: string;
  avatar: string;
  status: string;
}

function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const demoStudents = [
  { id: 1, name: "María González Pérez", grade: "5° Primaria", section: "A", status: "active" },
  { id: 2, name: "Juan Pérez Rodríguez", grade: "4° Primaria", section: "B", status: "active" },
  { id: 3, name: "Sofía Martínez López", grade: "3° Secundaria", section: "A", status: "active" },
  { id: 4, name: "Diego Ramírez Silva", grade: "2° Secundaria", section: "B", status: "active" },
  { id: 5, name: "Valentina Torres Castro", grade: "4 años", section: "A", status: "active" },
  { id: 6, name: "Mateo Flores Ruiz", grade: "1° Secundaria", section: "A", status: "active" },
  { id: 7, name: "Isabella Vargas Díaz", grade: "5 años", section: "B", status: "active" },
  { id: 8, name: "Santiago Morales Cruz", grade: "3° Primaria", section: "A", status: "active" },
];

// Canonical grade ordering
const GRADE_ORDER = [
  "3 años", "4 años", "5 años",
  "1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria",
  "1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria",
];

function buildGradeGroups(students: { id: number; name: string; grade: string; section: string; status: string }[]): GradeGroup[] {
  const map = new Map<string, Map<string, GradeStudent[]>>();

  for (const s of students) {
    if (!map.has(s.grade)) map.set(s.grade, new Map());
    const sectionMap = map.get(s.grade)!;
    if (!sectionMap.has(s.section)) sectionMap.set(s.section, []);
    sectionMap.get(s.section)!.push({
      id: s.id,
      name: s.name,
      avatar: generateAvatar(s.name),
      status: s.status,
    });
  }

  const groups: GradeGroup[] = [];
  for (const [grade, sectionMap] of map) {
    const sections: SectionGroup[] = [];
    let totalStudents = 0;
    for (const [section, students] of sectionMap) {
      students.sort((a, b) => a.name.localeCompare(b.name));
      sections.push({ section, students });
      totalStudents += students.length;
    }
    sections.sort((a, b) => a.section.localeCompare(b.section));
    groups.push({ grade, sections, totalStudents });
  }

  groups.sort((a, b) => {
    const ai = GRADE_ORDER.indexOf(a.grade);
    const bi = GRADE_ORDER.indexOf(b.grade);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });

  return groups;
}

export function useGradosData() {
  const { user, isProfesor } = useAuth();
  const [grades, setGrades] = useState<GradeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    if (!isSupabaseEnabled()) {
      // Demo mode
      let filtered = demoStudents;
      if (isProfesor) {
        // In demo mode professors see a subset
        filtered = demoStudents.filter((s) => s.grade === "3° Primaria" || s.grade === "4° Primaria");
      }
      setGrades(buildGradeGroups(filtered));
      setLoading(false);
      return;
    }

    // Supabase mode
    const fetchData = async () => {
      try {
        const [allStudents, classes] = await Promise.all([
          studentsService.getAll(),
          isProfesor && user?.uid
            ? classesService.getByTeacher(user.uid)
            : Promise.resolve(null),
        ]);

        let students = allStudents;

        // Build set of allowed grades for professor
        const allowedGrades = new Set<string>();

        if (isProfesor && user?.uid) {
          // Grades from classes table
          if (classes) {
            for (const c of classes) allowedGrades.add(c.grade);
          }

          // Also include grades from profile.assigned_grades
          if (supabase) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("assigned_grades")
              .eq("id", user.uid)
              .maybeSingle();
            if (profile?.assigned_grades) {
              for (const g of profile.assigned_grades.split(", ")) {
                if (g && g !== "Sin asignar") allowedGrades.add(g);
              }
            }
          }

          if (allowedGrades.size > 0) {
            students = allStudents.filter((s) => allowedGrades.has(s.grade));
          } else {
            students = [];
          }
        }

        const groups = buildGradeGroups(students.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          section: s.section,
          status: s.status,
        })));

        // Ensure all assigned grades appear even if they have no students yet
        const existingGradeNames = new Set(groups.map((g) => g.grade));
        for (const grade of allowedGrades) {
          if (!existingGradeNames.has(grade)) {
            groups.push({ grade, sections: [], totalStudents: 0 });
          }
        }

        // Re-sort after adding empty grades
        const GRADE_ORDER_LOCAL = [
          "3 años", "4 años", "5 años",
          "1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria",
          "1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria",
        ];
        groups.sort((a, b) => {
          const ai = GRADE_ORDER_LOCAL.indexOf(a.grade);
          const bi = GRADE_ORDER_LOCAL.indexOf(b.grade);
          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

        setGrades(groups);
      } catch {
        setError("Error al cargar los grados. Verifica tu conexión.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isProfesor, user]);

  return { grades, loading, error };
}
