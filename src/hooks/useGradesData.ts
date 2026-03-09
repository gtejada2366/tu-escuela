import { useState, useEffect, useCallback } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
import { gradesService } from "../services/grades.service";

export interface GradeStudent {
  id: number;
  name: string;
  exam1: number;
  exam2: number;
  homework: number;
  participation: number;
  average: number;
  grades: Array<{ week: string; grade: number }>;
}

export interface GradeClass {
  id: number;
  name: string;
  students: number;
}

const demoClasses: GradeClass[] = [
  { id: 1, name: "Matemática 3° Primaria A", students: 28 },
  { id: 2, name: "Matemática 4° Primaria B", students: 25 },
  { id: 3, name: "Álgebra 2° Secundaria A", students: 30 },
];

const demoStudents: GradeStudent[] = [
  { id: 1, name: "María González Pérez", exam1: 18, exam2: 17, homework: 19, participation: 18, average: 18, grades: [{ week: "Sem 1", grade: 16 }, { week: "Sem 2", grade: 17 }, { week: "Sem 3", grade: 18 }, { week: "Sem 4", grade: 18 }] },
  { id: 2, name: "Juan Pérez Rodríguez", exam1: 16, exam2: 18, homework: 17, participation: 15, average: 16.5, grades: [{ week: "Sem 1", grade: 15 }, { week: "Sem 2", grade: 16 }, { week: "Sem 3", grade: 17 }, { week: "Sem 4", grade: 18 }] },
  { id: 3, name: "Sofía Martínez López", exam1: 19, exam2: 20, homework: 18, participation: 19, average: 19, grades: [{ week: "Sem 1", grade: 18 }, { week: "Sem 2", grade: 19 }, { week: "Sem 3", grade: 19 }, { week: "Sem 4", grade: 20 }] },
  { id: 4, name: "Diego Ramírez Silva", exam1: 14, exam2: 13, homework: 15, participation: 14, average: 14, grades: [{ week: "Sem 1", grade: 13 }, { week: "Sem 2", grade: 14 }, { week: "Sem 3", grade: 14 }, { week: "Sem 4", grade: 15 }] },
  { id: 5, name: "Valentina Torres Castro", exam1: 17, exam2: 18, homework: 17, participation: 16, average: 17, grades: [{ week: "Sem 1", grade: 16 }, { week: "Sem 2", grade: 17 }, { week: "Sem 3", grade: 17 }, { week: "Sem 4", grade: 18 }] },
  { id: 6, name: "Mateo Flores Ruiz", exam1: 15, exam2: 16, homework: 16, participation: 15, average: 15.5, grades: [{ week: "Sem 1", grade: 14 }, { week: "Sem 2", grade: 15 }, { week: "Sem 3", grade: 16 }, { week: "Sem 4", grade: 17 }] },
  { id: 7, name: "Isabella Vargas Díaz", exam1: 18, exam2: 17, homework: 19, participation: 18, average: 18, grades: [{ week: "Sem 1", grade: 17 }, { week: "Sem 2", grade: 18 }, { week: "Sem 3", grade: 18 }, { week: "Sem 4", grade: 19 }] },
  { id: 8, name: "Santiago Morales Cruz", exam1: 16, exam2: 17, homework: 15, participation: 16, average: 16, grades: [{ week: "Sem 1", grade: 15 }, { week: "Sem 2", grade: 16 }, { week: "Sem 3", grade: 16 }, { week: "Sem 4", grade: 17 }] },
];

export function useGradesData() {
  const [availableClasses] = useState<GradeClass[]>(demoClasses);
  const [selectedClass, setSelectedClass] = useState<GradeClass>(demoClasses[0]);
  const [studentsData, setStudentsData] = useState<GradeStudent[]>(demoStudents);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    gradesService.getByClass(selectedClass.id).then((data) => {
      if (data.length > 0) {
        setStudentsData(data.map((g) => ({
          id: g.student_id,
          name: g.student_name,
          exam1: Number(g.exam1) || 0,
          exam2: Number(g.exam2) || 0,
          homework: Number(g.homework) || 0,
          participation: Number(g.participation) || 0,
          average: Number(g.average) || 0,
          grades: [],
        })));
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, [selectedClass]);

  const updateGrade = useCallback((studentId: number, field: keyof GradeStudent, value: string) => {
    const numValue = Math.min(20, Math.max(0, parseFloat(value) || 0));
    setStudentsData((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const updated = { ...student, [field]: numValue };
        updated.average = parseFloat(((updated.exam1 + updated.exam2 + updated.homework + updated.participation) / 4).toFixed(1));
        return updated;
      })
    );
  }, []);

  const saveGrades = useCallback(async () => {
    if (!isSupabaseEnabled()) return;
    const errors: string[] = [];
    for (const s of studentsData) {
      const error = await gradesService.upsert({
        class_id: selectedClass.id,
        student_id: s.id,
        period: "bimestre_1",
        exam1: s.exam1,
        exam2: s.exam2,
        homework: s.homework,
        participation: s.participation,
      });
      if (error) errors.push(`${s.name}: ${error}`);
    }
    if (errors.length > 0) throw new Error(errors.join("; "));
  }, [studentsData, selectedClass]);

  const exportCSV = useCallback(() => {
    const headers = "Estudiante,Examen 1,Examen 2,Tarea,Participación,Promedio\n";
    const rows = studentsData.map((s) => `${s.name},${s.exam1},${s.exam2},${s.homework},${s.participation},${s.average}`).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calificaciones-${selectedClass.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [studentsData, selectedClass]);

  const courseStats = studentsData.length > 0 ? {
    average: parseFloat((studentsData.reduce((acc, s) => acc + s.average, 0) / studentsData.length).toFixed(1)),
    highest: Math.max(...studentsData.map((s) => s.average)),
    lowest: Math.min(...studentsData.map((s) => s.average)),
  } : { average: 0, highest: 0, lowest: 0 };

  return {
    availableClasses,
    selectedClass,
    setSelectedClass,
    studentsData,
    setStudentsData,
    loading,
    updateGrade,
    saveGrades,
    exportCSV,
    courseStats,
  };
}
