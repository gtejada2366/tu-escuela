import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { classesService } from "../services/classes.service";
import { gradesService } from "../services/grades.service";
import { studentsService } from "../services/students.service";
import { useAuth } from "../contexts/AuthContext";
import type { GradeColumnConfig } from "../types/database";

export type { GradeColumnConfig };

export const DEFAULT_GRADE_CONFIG: GradeColumnConfig[] = [
  { label: "Examen 1", weight: 1 },
  { label: "Examen 2", weight: 1 },
  { label: "Tarea", weight: 1 },
  { label: "Participación", weight: 1 },
];

export interface GradeStudent {
  id: number;
  name: string;
  values: number[];
  average: number;
}

export interface GradeClass {
  id: number;
  name: string;
  students: number;
}

export function calcWeightedAverage(values: number[], config: GradeColumnConfig[]): number {
  const totalWeight = config.reduce((sum, c) => sum + c.weight, 0);
  if (totalWeight === 0) return 0;
  const weighted = values.reduce((sum, v, i) => sum + v * (config[i]?.weight ?? 0), 0);
  return parseFloat((weighted / totalWeight).toFixed(1));
}

const demoClasses: GradeClass[] = [
  { id: 1, name: "Matemática 3° Primaria A", students: 28 },
  { id: 2, name: "Matemática 4° Primaria B", students: 25 },
  { id: 3, name: "Álgebra 2° Secundaria A", students: 30 },
];

const demoStudents: GradeStudent[] = [
  { id: 1, name: "María González Pérez", values: [18, 17, 19, 18], average: 18 },
  { id: 2, name: "Juan Pérez Rodríguez", values: [16, 18, 17, 15], average: 16.5 },
  { id: 3, name: "Sofía Martínez López", values: [19, 20, 18, 19], average: 19 },
  { id: 4, name: "Diego Ramírez Silva", values: [14, 13, 15, 14], average: 14 },
  { id: 5, name: "Valentina Torres Castro", values: [17, 18, 17, 16], average: 17 },
  { id: 6, name: "Mateo Flores Ruiz", values: [15, 16, 16, 15], average: 15.5 },
  { id: 7, name: "Isabella Vargas Díaz", values: [18, 17, 19, 18], average: 18 },
  { id: 8, name: "Santiago Morales Cruz", values: [16, 17, 15, 16], average: 16 },
];

export function useGradesData() {
  const { user, isProfesor } = useAuth();
  const supabaseOn = isSupabaseEnabled();

  const [availableClasses, setAvailableClasses] = useState<GradeClass[]>(() =>
    supabaseOn ? [] : demoClasses
  );
  const [selectedClass, setSelectedClass] = useState<GradeClass | null>(() =>
    supabaseOn ? null : demoClasses[0]
  );
  const [gradeConfig, setGradeConfig] = useState<GradeColumnConfig[]>(DEFAULT_GRADE_CONFIG);
  const [studentsData, setStudentsData] = useState<GradeStudent[]>(() =>
    supabaseOn ? [] : demoStudents
  );
  const [loading, setLoading] = useState(supabaseOn);
  const [error, setError] = useState<string | null>(null);

  // Load classes list
  useEffect(() => {
    if (!supabaseOn) return;
    setLoading(true);

    const loadClasses = async () => {
      const data = isProfesor && user?.uid
        ? await classesService.getByTeacher(user.uid)
        : await classesService.getAll();

      if (data.length > 0) {
        const mapped = data.map((c) => ({
          id: c.id,
          name: `${c.subject} ${c.grade} ${c.section}`.trim(),
          students: Number(c.student_count) || 0,
        }));
        setAvailableClasses(mapped);
        setSelectedClass(mapped[0]);
        return;
      }

      // Professor fallback: placeholder classes from profile
      if (isProfesor && user?.uid && supabase) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("specializations, assigned_grades")
          .eq("id", user.uid)
          .maybeSingle();
        if (profile) {
          const subjects = (profile.specializations ?? "").split(", ").filter((s: string) => s && s !== "Sin asignar");
          const grades = (profile.assigned_grades ?? "").split(", ").filter((s: string) => s && s !== "Sin asignar");
          if (subjects.length > 0 && grades.length > 0) {
            let idCounter = -1;
            const placeholder: GradeClass[] = [];
            for (const subject of subjects) {
              for (const grade of grades) {
                placeholder.push({ id: idCounter--, name: `${subject} ${grade}`, students: 0 });
              }
            }
            setAvailableClasses(placeholder);
            setSelectedClass(placeholder[0]);
            return;
          }
        }
      }

      setAvailableClasses([]);
      setSelectedClass(null);
      setLoading(false);
    };

    loadClasses().catch(() => {
      setError("Error al cargar las clases. Verifica tu conexión.");
      setLoading(false);
    });
  }, [isProfesor, user, supabaseOn]);

  // Load config + students when selected class changes
  useEffect(() => {
    if (!supabaseOn || !selectedClass) {
      if (supabaseOn) setStudentsData([]);
      setLoading(false);
      return;
    }
    if (selectedClass.id < 0) {
      setStudentsData([]);
      setGradeConfig(DEFAULT_GRADE_CONFIG);
      setLoading(false);
      return;
    }

    setLoading(true);

    const loadAll = async () => {
      // Load class info (includes grade_config)
      const classInfo = await classesService.getById(selectedClass.id);
      const config: GradeColumnConfig[] =
        classInfo?.grade_config && Array.isArray(classInfo.grade_config) && classInfo.grade_config.length > 0
          ? classInfo.grade_config
          : DEFAULT_GRADE_CONFIG;
      setGradeConfig(config);

      // Load enrollments + grade records
      const enrollments = await classesService.getEnrollments(selectedClass.id);
      const gradeRecords = await gradesService.getByClass(selectedClass.id);
      const gradeMap = new Map<number, (typeof gradeRecords)[0]>();
      for (const g of gradeRecords) gradeMap.set(g.student_id, g);

      // Build student list from enrollments or fallback to grade match
      type RawStudent = { id: number; name: string };
      let rawStudents: RawStudent[];

      if (enrollments.length > 0) {
        rawStudents = enrollments.map((e) => ({ id: e.student_id, name: e.student_name }));
        // Include students with grade records but not in enrollments
        const enrolledIds = new Set(enrollments.map((e) => e.student_id));
        for (const g of gradeRecords) {
          if (!enrolledIds.has(g.student_id)) {
            rawStudents.push({ id: g.student_id, name: g.student_name });
          }
        }
      } else if (classInfo) {
        const gradeStudents = await studentsService.getByGrade(
          classInfo.grade,
          classInfo.section || undefined,
        );
        rawStudents = gradeStudents
          .filter((s) => s.status === "active")
          .map((s) => ({ id: s.id, name: s.name }));
      } else {
        rawStudents = [];
      }

      // Map to GradeStudent with values from grade_values or legacy fields
      const students: GradeStudent[] = rawStudents.map((s) => {
        const g = gradeMap.get(s.id);
        let values: number[];
        if (g?.grade_values && Array.isArray(g.grade_values) && g.grade_values.length > 0) {
          values = g.grade_values.map((v) => Number(v) || 0);
        } else if (g) {
          values = [Number(g.exam1) || 0, Number(g.exam2) || 0, Number(g.homework) || 0, Number(g.participation) || 0];
        } else {
          values = new Array(config.length).fill(0);
        }
        // Pad or trim to match config length
        while (values.length < config.length) values.push(0);
        if (values.length > config.length) values = values.slice(0, config.length);

        return { id: s.id, name: s.name, values, average: calcWeightedAverage(values, config) };
      });

      students.sort((a, b) => a.name.localeCompare(b.name));
      setStudentsData(students);
      setLoading(false);
    };

    loadAll().catch(() => {
      setError("Error al cargar las calificaciones. Verifica tu conexión.");
      setStudentsData([]);
      setLoading(false);
    });
  }, [selectedClass, supabaseOn]);

  const updateGrade = useCallback((studentId: number, colIndex: number, value: string) => {
    const numValue = Math.min(20, Math.max(0, parseFloat(value) || 0));
    setStudentsData((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;
        const newValues = [...student.values];
        newValues[colIndex] = numValue;
        return { ...student, values: newValues, average: calcWeightedAverage(newValues, gradeConfig) };
      })
    );
  }, [gradeConfig]);

  const saveGrades = useCallback(async () => {
    if (!supabaseOn || !selectedClass || selectedClass.id < 0) return;
    const errors: string[] = [];
    for (const s of studentsData) {
      const error = await gradesService.upsert({
        class_id: selectedClass.id,
        student_id: s.id,
        period: "bimestre_1",
        exam1: s.values[0] ?? 0,
        exam2: s.values[1] ?? 0,
        homework: s.values[2] ?? 0,
        participation: s.values[3] ?? 0,
        grade_values: s.values,
      });
      if (error) errors.push(`${s.name}: ${error}`);
    }
    if (errors.length > 0) throw new Error(errors.join("; "));
  }, [studentsData, selectedClass, supabaseOn]);

  const saveConfig = useCallback(async (newConfig: GradeColumnConfig[]) => {
    if (supabaseOn && selectedClass && selectedClass.id > 0) {
      const error = await classesService.update(selectedClass.id, { grade_config: newConfig });
      if (error) throw new Error(error);
    }
    setGradeConfig(newConfig);
    // Adjust student values arrays and recalculate averages
    setStudentsData((prev) =>
      prev.map((s) => {
        const values = [...s.values];
        while (values.length < newConfig.length) values.push(0);
        const trimmed = values.slice(0, newConfig.length);
        return { ...s, values: trimmed, average: calcWeightedAverage(trimmed, newConfig) };
      })
    );
  }, [supabaseOn, selectedClass]);

  const exportCSV = useCallback(() => {
    const headers = ["Estudiante", ...gradeConfig.map((c) => c.label), "Promedio"].join(",") + "\n";
    const rows = studentsData.map((s) =>
      [s.name, ...s.values, s.average].join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calificaciones-${selectedClass?.name ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [studentsData, gradeConfig, selectedClass]);

  const courseStats = studentsData.length > 0 ? {
    average: parseFloat((studentsData.reduce((acc, s) => acc + s.average, 0) / studentsData.length).toFixed(1)),
    highest: Math.max(...studentsData.map((s) => s.average)),
    lowest: Math.min(...studentsData.map((s) => s.average)),
  } : { average: 0, highest: 0, lowest: 0 };

  return {
    availableClasses,
    selectedClass,
    setSelectedClass,
    gradeConfig,
    studentsData,
    setStudentsData,
    loading,
    error,
    updateGrade,
    saveGrades,
    saveConfig,
    exportCSV,
    courseStats,
  };
}
