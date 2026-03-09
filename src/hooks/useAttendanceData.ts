import { useState, useEffect, useCallback } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
import { attendanceService } from "../services/attendance.service";
import { classesService } from "../services/classes.service";

export type AttendanceStatus = "Presente" | "Ausente" | "Tardanza";

export interface StudentRecord {
  id: number;
  name: string;
  status: AttendanceStatus;
}

export interface ClassAttendance {
  id: number;
  grade: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  students: StudentRecord[];
}

const studentNamesByClass: Record<number, string[]> = {
  1: ["María López", "Carlos Pérez", "Ana García", "Luis Rodríguez", "Sofía Martínez", "Diego Hernández", "Valentina Torres"],
  2: ["Camila Flores", "Mateo Ramírez", "Isabella Cruz", "Sebastián Morales", "Lucía Vargas", "Daniel Castillo", "Emma Reyes", "Alejandro Díaz"],
  3: ["Gabriela Mendoza", "Nicolás Sánchez", "Victoria Romero", "Samuel Jiménez", "Martina Ruiz", "Tomás Navarro"],
  4: ["Renata Guzmán", "Emiliano Ortega", "Catalina Medina", "Joaquín Herrera", "Fernanda Castro", "Andrés Paredes", "Paula Rivas", "Miguel Salazar"],
  5: ["Valeria Aguilar", "Santiago Peña", "Antonella Vega", "Matías Campos", "Julieta Figueroa", "Leonardo Soto"],
};

function buildStudents(classId: number, absent: number, late: number): StudentRecord[] {
  const names = studentNamesByClass[classId] || [];
  const students: StudentRecord[] = [];
  let aCount = 0;
  let lCount = 0;
  for (let i = 0; i < names.length; i++) {
    let status: AttendanceStatus = "Presente";
    if (aCount < absent) { status = "Ausente"; aCount++; }
    else if (lCount < late) { status = "Tardanza"; lCount++; }
    students.push({ id: i + 1, name: names[i], status });
  }
  return students;
}

function buildDemoData(): ClassAttendance[] {
  const raw = [
    { id: 1, grade: "5° Primaria A", total: 28, present: 26, absent: 1, late: 1, percentage: 92.9 },
    { id: 2, grade: "4° Primaria B", total: 30, present: 29, absent: 1, late: 0, percentage: 96.7 },
    { id: 3, grade: "3° Secundaria A", total: 25, present: 24, absent: 0, late: 1, percentage: 96.0 },
    { id: 4, grade: "2° Secundaria B", total: 27, present: 25, absent: 2, late: 0, percentage: 92.6 },
    { id: 5, grade: "5 años A", total: 24, present: 24, absent: 0, late: 0, percentage: 100 },
  ];
  return raw.map((cls) => ({ ...cls, students: buildStudents(cls.id, cls.absent, cls.late) }));
}

export function recalcClass(cls: ClassAttendance): ClassAttendance {
  const present = cls.students.filter((s) => s.status === "Presente").length;
  const absent = cls.students.filter((s) => s.status === "Ausente").length;
  const late = cls.students.filter((s) => s.status === "Tardanza").length;
  const percentage = cls.total > 0 ? parseFloat(((present / cls.total) * 100).toFixed(1)) : 0;
  return { ...cls, present, absent, late, percentage };
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useAttendanceData() {
  const [classesData, setClassesData] = useState<ClassAttendance[]>(buildDemoData);
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 2, 8));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch when date changes (Supabase mode)
  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    setError(null);
    attendanceService.getSummaryByDate(toISODate(selectedDate)).then((data) => {
      if (data.length > 0) {
        setClassesData(data.map((s) => ({
          id: s.class_id,
          grade: s.grade,
          total: s.total,
          present: s.present,
          absent: s.absent,
          late: s.late,
          percentage: s.percentage,
          students: [],
        })));
      }
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, [selectedDate]);

  const changeDate = useCallback((date: Date) => {
    setSelectedDate(date);
    if (!isSupabaseEnabled()) {
      // Demo mode: generate varied data by date seed
      const seed = date.getDate() + date.getMonth() * 31;
      setClassesData(buildDemoData().map((cls) => {
        const variation = ((seed * cls.id) % 3);
        const newStudents = cls.students.map((s, i) => {
          if (i === variation) return { ...s, status: "Tardanza" as AttendanceStatus };
          if (i === cls.students.length - 1 - (variation % 2) && s.status === "Presente") return { ...s, status: "Ausente" as AttendanceStatus };
          return s;
        });
        return recalcClass({ ...cls, students: newStudents });
      }));
    }
  }, []);

  const saveAttendance = useCallback(async (classId: number, students: StudentRecord[]) => {
    if (isSupabaseEnabled()) {
      const statusMap: Record<AttendanceStatus, string> = { Presente: "present", Ausente: "absent", Tardanza: "late" };
      await attendanceService.upsertBatch(
        students.map((s) => ({
          class_id: classId,
          student_id: s.id,
          date: toISODate(selectedDate),
          status: statusMap[s.status] as "present" | "absent" | "late",
        }))
      );
    }
    setClassesData((prev) =>
      prev.map((cls) => cls.id === classId ? recalcClass({ ...cls, students: students.map((s) => ({ ...s })) }) : cls)
    );
  }, [selectedDate]);

  const loadClassStudents = useCallback(async (classId: number): Promise<StudentRecord[]> => {
    if (!isSupabaseEnabled()) {
      const cls = classesData.find((c) => c.id === classId);
      return cls?.students ?? [];
    }

    const statusMap: Record<string, AttendanceStatus> = { present: "Presente", absent: "Ausente", late: "Tardanza" };

    const [enrollments, records] = await Promise.all([
      classesService.getEnrollments(classId),
      attendanceService.getByClassAndDate(classId, toISODate(selectedDate)),
    ]);

    const students: StudentRecord[] = enrollments.map((e) => {
      const record = records.find((r) => r.student_id === e.student_id);
      return {
        id: e.student_id,
        name: e.student_name,
        status: record ? statusMap[record.status] ?? "Presente" : "Presente",
      };
    });

    // Update classesData with the fetched students
    setClassesData((prev) =>
      prev.map((cls) => cls.id === classId ? { ...cls, students } : cls)
    );

    return students;
  }, [classesData, selectedDate]);

  return { classesData, setClassesData, selectedDate, changeDate, loading, error, saveAttendance, recalcClass, loadClassStudents };
}
