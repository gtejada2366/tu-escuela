import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { classesService } from "../services/classes.service";

export interface ClassInfo {
  id: number;
  subject: string;
  grade: string;
  section: string;
  teacher: string;
  teacherId: number;
  students: number;
  schedule: string;
  classroom: string;
  status: string;
}

export interface ClassStudent {
  id: number;
  name: string;
  code: string;
  attendance: number;
  average: number;
}

const classesMap: Record<string, { classInfo: ClassInfo; students: ClassStudent[] }> = {
  "1": {
    classInfo: { id: 1, subject: "Matemática", grade: "3° Primaria", section: "A", teacher: "Carlos Mendoza Ruiz", teacherId: 2, students: 28, schedule: "Lun-Mie-Vie 8:00-9:30", classroom: "Aula 205", status: "active" },
    students: [
      { id: 1, name: "María González Pérez", code: "EST-2023-001", attendance: 96.5, average: 18 },
      { id: 2, name: "Juan Pérez Rodríguez", code: "EST-2023-002", attendance: 94.2, average: 16 },
      { id: 3, name: "Sofía Martínez López", code: "EST-2023-003", attendance: 98.1, average: 19 },
      { id: 4, name: "Diego Ramírez Silva", code: "EST-2023-004", attendance: 89.3, average: 14 },
      { id: 5, name: "Valentina Torres Castro", code: "EST-2023-005", attendance: 97.8, average: 17 },
      { id: 6, name: "Mateo Flores Ruiz", code: "EST-2023-006", attendance: 91.5, average: 16 },
      { id: 7, name: "Isabella Vargas Díaz", code: "EST-2023-007", attendance: 95.2, average: 18 },
      { id: 8, name: "Santiago Morales Cruz", code: "EST-2023-008", attendance: 93.7, average: 16 },
    ],
  },
  "2": {
    classInfo: { id: 2, subject: "Comunicación", grade: "4° Primaria", section: "B", teacher: "Ana Sofía Reyes Torres", teacherId: 3, students: 25, schedule: "Mar-Jue 10:00-11:30", classroom: "Aula 301", status: "active" },
    students: [
      { id: 1, name: "Camila Flores Ruiz", code: "EST-2023-009", attendance: 95.3, average: 17 },
      { id: 2, name: "Mateo Ramírez Cruz", code: "EST-2023-010", attendance: 92.1, average: 15 },
      { id: 3, name: "Isabella Cruz Mendoza", code: "EST-2023-011", attendance: 97.5, average: 18 },
      { id: 4, name: "Sebastián Morales Díaz", code: "EST-2023-012", attendance: 88.9, average: 14 },
      { id: 5, name: "Lucía Vargas Torres", code: "EST-2023-013", attendance: 96.8, average: 16 },
      { id: 6, name: "Daniel Castillo Reyes", code: "EST-2023-014", attendance: 93.4, average: 17 },
    ],
  },
  "3": {
    classInfo: { id: 3, subject: "Ciencias", grade: "2° Secundaria", section: "A", teacher: "Roberto García Mendez", teacherId: 4, students: 30, schedule: "Lun-Mie 14:00-15:30", classroom: "Lab. 102", status: "active" },
    students: [
      { id: 1, name: "Gabriela Mendoza Sánchez", code: "EST-2023-015", attendance: 94.7, average: 16 },
      { id: 2, name: "Nicolás Sánchez Romero", code: "EST-2023-016", attendance: 91.3, average: 15 },
      { id: 3, name: "Victoria Romero Jiménez", code: "EST-2023-017", attendance: 98.2, average: 19 },
      { id: 4, name: "Samuel Jiménez Ruiz", code: "EST-2023-018", attendance: 89.5, average: 14 },
      { id: 5, name: "Martina Ruiz Navarro", code: "EST-2023-019", attendance: 96.1, average: 17 },
    ],
  },
  "4": {
    classInfo: { id: 4, subject: "Historia", grade: "3° Secundaria", section: "B", teacher: "María Fernanda López", teacherId: 5, students: 27, schedule: "Mar-Jue-Vie 8:00-9:30", classroom: "Aula 402", status: "active" },
    students: [
      { id: 1, name: "Renata Guzmán Ortega", code: "EST-2023-020", attendance: 97.0, average: 18 },
      { id: 2, name: "Emiliano Ortega Medina", code: "EST-2023-021", attendance: 93.8, average: 16 },
      { id: 3, name: "Catalina Medina Herrera", code: "EST-2023-022", attendance: 95.4, average: 17 },
      { id: 4, name: "Joaquín Herrera Castro", code: "EST-2023-023", attendance: 90.2, average: 15 },
      { id: 5, name: "Fernanda Castro Paredes", code: "EST-2023-024", attendance: 94.6, average: 16 },
    ],
  },
  "5": {
    classInfo: { id: 5, subject: "Inglés", grade: "5 años", section: "A", teacher: "Patricia Campos Rojas", teacherId: 7, students: 26, schedule: "Lun-Mie-Vie 10:00-11:30", classroom: "Aula 103", status: "active" },
    students: [
      { id: 1, name: "Valeria Aguilar Peña", code: "EST-2023-025", attendance: 96.5, average: 17 },
      { id: 2, name: "Santiago Peña Vega", code: "EST-2023-026", attendance: 94.0, average: 16 },
      { id: 3, name: "Antonella Vega Campos", code: "EST-2023-027", attendance: 97.3, average: 18 },
      { id: 4, name: "Matías Campos Figueroa", code: "EST-2023-028", attendance: 92.8, average: 15 },
    ],
  },
  "6": {
    classInfo: { id: 6, subject: "Educación Física", grade: "2° Primaria", section: "A", teacher: "José Luis Paredes Silva", teacherId: 6, students: 24, schedule: "Mar-Jue 14:00-15:30", classroom: "Patio Central", status: "active" },
    students: [
      { id: 1, name: "Emilia Rosas León", code: "EST-2023-029", attendance: 95.0, average: 17 },
      { id: 2, name: "Thiago León Salazar", code: "EST-2023-030", attendance: 93.2, average: 16 },
      { id: 3, name: "Mía Salazar Bravo", code: "EST-2023-031", attendance: 97.8, average: 18 },
      { id: 4, name: "Luca Bravo Ríos", code: "EST-2023-032", attendance: 91.5, average: 15 },
    ],
  },
  "7": {
    classInfo: { id: 7, subject: "Arte y Cultura", grade: "4 años", section: "B", teacher: "Fernando Díaz Castro", teacherId: 8, students: 22, schedule: "Lun-Vie 8:00-9:30", classroom: "Taller de Arte", status: "inactive" },
    students: [
      { id: 1, name: "Luna Navarro Ponce", code: "EST-2023-033", attendance: 96.0, average: 17 },
      { id: 2, name: "Ian Ponce Delgado", code: "EST-2023-034", attendance: 94.5, average: 16 },
      { id: 3, name: "Zoe Delgado Figueroa", code: "EST-2023-035", attendance: 98.0, average: 19 },
    ],
  },
  "8": {
    classInfo: { id: 8, subject: "Matemática", grade: "1° Secundaria", section: "B", teacher: "Gabriela Núñez Vega", teacherId: 9, students: 29, schedule: "Mar-Jue 8:00-9:30", classroom: "Aula 305", status: "active" },
    students: [
      { id: 1, name: "Tomás Reyes Figueroa", code: "EST-2023-036", attendance: 95.5, average: 17 },
      { id: 2, name: "Paula Jiménez Bravo", code: "EST-2023-037", attendance: 93.0, average: 16 },
      { id: 3, name: "Alejandro Soto Méndez", code: "EST-2023-038", attendance: 97.2, average: 18 },
      { id: 4, name: "Luciana Castro Paredes", code: "EST-2023-039", attendance: 90.8, average: 15 },
      { id: 5, name: "Emilio Guzmán Vega", code: "EST-2023-040", attendance: 94.3, average: 16 },
    ],
  },
};

export function useClaseDetailData(id: string | undefined) {
  const entry = classesMap[id ?? ""];
  const [classInfo, setClassInfo] = useState<ClassInfo>(
    entry?.classInfo ?? { id: 0, subject: "", grade: "", section: "", teacher: "", teacherId: 0, students: 0, schedule: "", classroom: "", status: "inactive" }
  );
  const [students, setStudents] = useState<ClassStudent[]>(entry?.students ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [found, setFound] = useState(!!entry);

  useEffect(() => {
    if (!isSupabaseEnabled() || !id) return;
    setLoading(true);
    setError(null);

    const numId = Number(id);
    Promise.all([
      classesService.getById(numId),
      classesService.getEnrollments(numId),
      supabase ? supabase.from("attendance").select("student_id, status").eq("class_id", numId) : Promise.resolve({ data: [] }),
      supabase ? supabase.from("grades").select("student_id, average").eq("class_id", numId) : Promise.resolve({ data: [] }),
    ]).then(([cls, enrollments, attRes, gradesRes]) => {
      if (cls) {
        setClassInfo({
          id: cls.id,
          subject: cls.subject,
          grade: cls.grade,
          section: cls.section,
          teacher: cls.teacher_name ?? "",
          teacherId: 0,
          students: cls.student_count ?? enrollments.length,
          schedule: cls.schedule ?? "",
          classroom: cls.classroom ?? "",
          status: cls.status,
        });

        // Build attendance map per student
        const attMap: Record<number, { total: number; present: number }> = {};
        for (const a of (attRes as any).data ?? []) {
          if (!attMap[a.student_id]) attMap[a.student_id] = { total: 0, present: 0 };
          attMap[a.student_id].total++;
          if (a.status === "present" || a.status === "late") attMap[a.student_id].present++;
        }

        // Build average grade map per student
        const gradeMap: Record<number, { sum: number; count: number }> = {};
        for (const g of (gradesRes as any).data ?? []) {
          if (!gradeMap[g.student_id]) gradeMap[g.student_id] = { sum: 0, count: 0 };
          gradeMap[g.student_id].sum += Number(g.average) || 0;
          gradeMap[g.student_id].count++;
        }

        const mapped = enrollments.map((e) => {
          const att = attMap[e.student_id];
          const gr = gradeMap[e.student_id];
          return {
            id: e.student_id,
            name: e.student_name,
            code: `EST-${String(e.student_id).padStart(3, "0")}`,
            attendance: att && att.total > 0
              ? Math.round((att.present / att.total) * 1000) / 10
              : 0,
            average: gr && gr.count > 0
              ? Math.round((gr.sum / gr.count) * 10) / 10
              : 0,
          };
        });
        if (mapped.length > 0) setStudents(mapped);
        setFound(true);
      }
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, [id]);

  const updateClassInfo = useCallback(async (updates: Partial<ClassInfo>) => {
    setClassInfo((prev) => ({ ...prev, ...updates }));

    if (isSupabaseEnabled()) {
      const numId = Number(id);
      await classesService.update(numId, {
        ...(updates.subject && { subject: updates.subject }),
        ...(updates.grade && { grade: updates.grade }),
        ...(updates.section && { section: updates.section }),
        ...(updates.schedule && { schedule: updates.schedule }),
        ...(updates.classroom && { classroom: updates.classroom }),
        ...(updates.status && { status: updates.status as "active" | "inactive" }),
      });
    }
  }, [id]);

  const addStudent = useCallback(async (name: string, code: string) => {
    setStudents((prev) => {
      const newId = Math.max(0, ...prev.map((s) => s.id)) + 1;
      return [...prev, { id: newId, name, code, attendance: 100, average: 0 }];
    });
  }, []);

  return { classInfo, setClassInfo, students, setStudents, loading, error, found, updateClassInfo, addStudent };
}
