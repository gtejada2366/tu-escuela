import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { classesService } from "../services/classes.service";
import { useAuth, type RegisteredUser } from "../contexts/AuthContext";

export interface ClassLocal {
  id: number;
  subject: string;
  grade: string;
  section: string;
  teacher: string;
  students: number;
  schedule: string;
  status: string;
}

const demoClasses: ClassLocal[] = [
  { id: 1, subject: "Matemática", grade: "3° Primaria", section: "A", teacher: "Carlos Mendoza Ruiz", students: 28, schedule: "Lun-Mie-Vie 8:00-9:30", status: "active" },
  { id: 2, subject: "Comunicación", grade: "4° Primaria", section: "B", teacher: "Ana Sofía Reyes Torres", students: 25, schedule: "Mar-Jue 10:00-11:30", status: "active" },
  { id: 3, subject: "Ciencias", grade: "2° Secundaria", section: "A", teacher: "Roberto García Mendez", students: 30, schedule: "Lun-Mie 14:00-15:30", status: "active" },
  { id: 4, subject: "Historia", grade: "3° Secundaria", section: "B", teacher: "María Fernanda López", students: 27, schedule: "Mar-Jue-Vie 8:00-9:30", status: "active" },
  { id: 5, subject: "Inglés", grade: "5 años", section: "A", teacher: "Patricia Campos Rojas", students: 26, schedule: "Lun-Mie-Vie 10:00-11:30", status: "active" },
  { id: 6, subject: "Educación Física", grade: "2° Primaria", section: "A", teacher: "José Luis Paredes Silva", students: 24, schedule: "Mar-Jue 14:00-15:30", status: "active" },
  { id: 7, subject: "Arte y Cultura", grade: "4 años", section: "B", teacher: "Fernando Díaz Castro", students: 22, schedule: "Lun-Vie 8:00-9:30", status: "inactive" },
  { id: 8, subject: "Matemática", grade: "1° Secundaria", section: "B", teacher: "Gabriela Núñez Vega", students: 29, schedule: "Mar-Jue 8:00-9:30", status: "active" },
];

export const SUBJECT_OPTIONS = ["Matemática", "Comunicación", "Ciencias", "Historia", "Inglés", "Educación Física", "Arte y Cultura"];
export const GRADE_OPTIONS_BY_LEVEL = [
  { level: "Inicial", grades: ["3 años", "4 años", "5 años"] },
  { level: "Primaria", grades: ["1° Primaria", "2° Primaria", "3° Primaria", "4° Primaria", "5° Primaria", "6° Primaria"] },
  { level: "Secundaria", grades: ["1° Secundaria", "2° Secundaria", "3° Secundaria", "4° Secundaria", "5° Secundaria"] },
];
export const ALL_GRADE_OPTIONS = GRADE_OPTIONS_BY_LEVEL.flatMap((g) => g.grades);
export const SECTION_OPTIONS = ["A", "B"];
export const STATUS_OPTIONS = [
  { value: "active", label: "Activo" },
  { value: "inactive", label: "Inactivo" },
];

export function useClassesData() {
  const { user, isProfesor, usersRegistry } = useAuth();
  const professorsList = usersRegistry.filter((u: RegisteredUser) => u.role === "profesor" && u.status === "active");

  const [classes, setClasses] = useState<ClassLocal[]>(() => {
    if (isProfesor) return demoClasses.filter((c) => c.teacher === user?.name);
    return demoClasses;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    const fetchClasses = isProfesor && user?.uid
      ? classesService.getByTeacher(user.uid)
      : classesService.getAll();
    fetchClasses.then(async (data) => {
      if (data.length > 0) {
        setClasses(data.map((c) => ({
          id: c.id,
          subject: c.subject,
          grade: c.grade,
          section: c.section,
          teacher: c.teacher_name ?? "",
          students: Number(c.student_count) || 0,
          schedule: c.schedule ?? "",
          status: c.status,
        })));
      } else if (isProfesor && user?.uid && supabase) {
        // No class records — build placeholder entries from profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("specializations, assigned_grades")
          .eq("id", user.uid)
          .maybeSingle();
        if (profile) {
          const subjects = (profile.specializations ?? "").split(", ").filter((s: string) => s && s !== "Sin asignar");
          const grades = (profile.assigned_grades ?? "").split(", ").filter((s: string) => s && s !== "Sin asignar");
          if (subjects.length > 0 && grades.length > 0) {
            let idCounter = 1;
            const placeholder: ClassLocal[] = [];
            for (const subject of subjects) {
              for (const grade of grades) {
                placeholder.push({
                  id: idCounter++,
                  subject,
                  grade,
                  section: "",
                  teacher: user.name,
                  students: 0,
                  schedule: "",
                  status: "active",
                });
              }
            }
            setClasses(placeholder);
          } else {
            setClasses([]);
          }
        } else {
          setClasses([]);
        }
      } else {
        setClasses([]);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [isProfesor, user]);

  const addClass = useCallback(async (cls: Omit<ClassLocal, "id">) => {
    if (isSupabaseEnabled()) {
      const teacherProfile = usersRegistry.find((u) => u.name === cls.teacher);
      const { data } = await classesService.create({
        subject: cls.subject,
        grade: cls.grade,
        section: cls.section,
        teacher_id: teacherProfile?.uid ?? null,
        schedule: cls.schedule,
        classroom: null,
        status: cls.status as "active" | "inactive",
        academic_year_id: null,
      });
      if (data) {
        setClasses((prev) => [...prev, { ...cls, id: data.id }]);
      }
    } else {
      const newId = Math.max(0, ...classes.map((c) => c.id)) + 1;
      setClasses((prev) => [...prev, { ...cls, id: newId }]);
    }
  }, [classes, usersRegistry]);

  const updateClass = useCallback(async (id: number, changes: Partial<ClassLocal>) => {
    if (isSupabaseEnabled()) {
      const teacherProfile = changes.teacher ? usersRegistry.find((u) => u.name === changes.teacher) : undefined;
      await classesService.update(id, {
        ...(changes.subject && { subject: changes.subject }),
        ...(changes.grade && { grade: changes.grade }),
        ...(changes.section && { section: changes.section }),
        ...(changes.schedule && { schedule: changes.schedule }),
        ...(changes.status && { status: changes.status as "active" | "inactive" }),
        ...(teacherProfile && { teacher_id: teacherProfile.uid ?? undefined }),
      });
    }
    setClasses((prev) => prev.map((c) => c.id === id ? { ...c, ...changes } : c));
  }, [usersRegistry]);

  const removeClass = useCallback(async (id: number) => {
    if (isSupabaseEnabled()) await classesService.remove(id);
    setClasses((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { classes, setClasses, loading, addClass, updateClass, removeClass, professorsList };
}
