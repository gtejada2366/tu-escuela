import { useState, useEffect, useCallback } from "react";
import { isSupabaseEnabled, supabase } from "../lib/supabase";
import { classesService } from "../services/classes.service";
import { authService } from "../services/auth.service";

export interface ProfessorClass {
  course: string;
  grade: string;
  section: string;
  schedule: string;
}

export interface WeeklySlot {
  time: string;
  class: string;
}

export interface WeeklyDay {
  day: string;
  slots: WeeklySlot[];
}

export interface ProfessorInfo {
  fullName: string;
  dni: string;
  phone: string;
  email: string;
  address: string;
  joinDate: string;
}

export interface ProfessorMetrics {
  classesThisWeek: number;
  averageAttendance: number;
  evaluationsRegistered: number;
}

export interface ProfessorProfile {
  id: number;
  name: string;
  subject: string;
  grades: string;
  status: string;
  avatar: string;
  info: ProfessorInfo;
  classes: ProfessorClass[];
  weeklySchedule: WeeklyDay[];
  metrics: ProfessorMetrics;
}

const professorsMap: Record<string, ProfessorProfile> = {
  "1": {
    id: 1, name: "Carlos Mendoza Ruiz", subject: "Matemáticas", grades: "3° Primaria, 4° Primaria, 1° Secundaria, 2° Secundaria", status: "active", avatar: "CM",
    info: { fullName: "Carlos Antonio Mendoza Ruiz", dni: "42345678", phone: "+51 987 654 321", email: "cmendoza@colegio.edu.pe", address: "Av. Los Pinos 456, San Isidro, Lima", joinDate: "15 de Marzo, 2020" },
    classes: [
      { course: "Matemática", grade: "3° Primaria", section: "A", schedule: "Lun-Mie-Vie 8:00-9:30" },
      { course: "Matemática", grade: "4° Primaria", section: "B", schedule: "Lun-Mie-Vie 10:00-11:30" },
      { course: "Álgebra", grade: "2° Secundaria", section: "A", schedule: "Mar-Jue 8:00-9:30" },
      { course: "Matemática", grade: "1° Secundaria", section: "B", schedule: "Mar-Jue 10:00-11:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:30", class: "Matemática 3° Prim A" }, { time: "10:00-11:30", class: "Matemática 4° Prim B" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Álgebra 2° Sec A" }, { time: "10:00-11:30", class: "Matemática 1° Sec B" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:30", class: "Matemática 3° Prim A" }, { time: "10:00-11:30", class: "Matemática 4° Prim B" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Álgebra 2° Sec A" }, { time: "10:00-11:30", class: "Matemática 1° Sec B" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:30", class: "Matemática 3° Prim A" }, { time: "10:00-11:30", class: "Matemática 4° Prim B" }] },
    ],
    metrics: { classesThisWeek: 12, averageAttendance: 94.5, evaluationsRegistered: 28 },
  },
  "2": {
    id: 2, name: "Ana Sofía Reyes Torres", subject: "Comunicación", grades: "1° Primaria, 2° Primaria, 3° Primaria", status: "active", avatar: "AR",
    info: { fullName: "Ana Sofía Reyes Torres", dni: "43567890", phone: "+51 976 543 210", email: "areyes@colegio.edu.pe", address: "Jr. Las Magnolias 789, Miraflores, Lima", joinDate: "10 de Agosto, 2019" },
    classes: [
      { course: "Comunicación", grade: "1° Primaria", section: "A", schedule: "Lun-Mie-Vie 8:00-9:30" },
      { course: "Comunicación", grade: "2° Primaria", section: "B", schedule: "Lun-Mie-Vie 10:00-11:30" },
      { course: "Comunicación", grade: "3° Primaria", section: "A", schedule: "Mar-Jue 8:00-9:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:30", class: "Comunicación 1° Prim A" }, { time: "10:00-11:30", class: "Comunicación 2° Prim B" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Comunicación 3° Prim A" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:30", class: "Comunicación 1° Prim A" }, { time: "10:00-11:30", class: "Comunicación 2° Prim B" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Comunicación 3° Prim A" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:30", class: "Comunicación 1° Prim A" }, { time: "10:00-11:30", class: "Comunicación 2° Prim B" }] },
    ],
    metrics: { classesThisWeek: 10, averageAttendance: 96.2, evaluationsRegistered: 22 },
  },
  "3": {
    id: 3, name: "Roberto García Mendez", subject: "Ciencias", grades: "1° Secundaria, 2° Secundaria, 3° Secundaria", status: "active", avatar: "RG",
    info: { fullName: "Roberto Carlos García Mendez", dni: "41234567", phone: "+51 965 432 109", email: "rgarcia@colegio.edu.pe", address: "Calle San Martín 234, Surco, Lima", joinDate: "3 de Febrero, 2018" },
    classes: [
      { course: "Ciencias Naturales", grade: "1° Secundaria", section: "A", schedule: "Lun-Mie-Vie 8:00-9:30" },
      { course: "Ciencias Naturales", grade: "2° Secundaria", section: "A", schedule: "Lun-Mie-Vie 10:00-11:30" },
      { course: "Biología", grade: "3° Secundaria", section: "B", schedule: "Mar-Jue 8:00-9:30" },
      { course: "Ciencias Naturales", grade: "3° Secundaria", section: "A", schedule: "Mar-Jue 10:00-11:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:30", class: "Ciencias 1° Sec A" }, { time: "10:00-11:30", class: "Ciencias 2° Sec A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Biología 3° Sec B" }, { time: "10:00-11:30", class: "Ciencias 3° Sec A" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:30", class: "Ciencias 1° Sec A" }, { time: "10:00-11:30", class: "Ciencias 2° Sec A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Biología 3° Sec B" }, { time: "10:00-11:30", class: "Ciencias 3° Sec A" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:30", class: "Ciencias 1° Sec A" }, { time: "10:00-11:30", class: "Ciencias 2° Sec A" }] },
    ],
    metrics: { classesThisWeek: 14, averageAttendance: 91.8, evaluationsRegistered: 30 },
  },
  "4": {
    id: 4, name: "María Fernanda López", subject: "Historia", grades: "4° Secundaria, 5° Secundaria", status: "inactive", avatar: "ML",
    info: { fullName: "María Fernanda López Gutiérrez", dni: "40876543", phone: "+51 954 321 098", email: "mflopez@colegio.edu.pe", address: "Av. Arequipa 567, Lince, Lima", joinDate: "22 de Julio, 2017" },
    classes: [
      { course: "Historia del Perú", grade: "4° Secundaria", section: "A", schedule: "Lun-Mie-Vie 8:00-9:30" },
      { course: "Historia Universal", grade: "5° Secundaria", section: "A", schedule: "Lun-Mie-Vie 10:00-11:30" },
      { course: "Historia del Perú", grade: "5° Secundaria", section: "B", schedule: "Mar-Jue 8:00-9:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:30", class: "Hist. Perú 4° Sec A" }, { time: "10:00-11:30", class: "Hist. Universal 5° Sec A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Hist. Perú 5° Sec B" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:30", class: "Hist. Perú 4° Sec A" }, { time: "10:00-11:30", class: "Hist. Universal 5° Sec A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Hist. Perú 5° Sec B" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:30", class: "Hist. Perú 4° Sec A" }, { time: "10:00-11:30", class: "Hist. Universal 5° Sec A" }] },
    ],
    metrics: { classesThisWeek: 8, averageAttendance: 89.3, evaluationsRegistered: 18 },
  },
  "5": {
    id: 5, name: "José Luis Paredes Silva", subject: "Educación Física", grades: "3 años, 4 años, 5 años, 1° Primaria", status: "active", avatar: "JP",
    info: { fullName: "José Luis Paredes Silva", dni: "44321098", phone: "+51 943 210 987", email: "jparedes@colegio.edu.pe", address: "Jr. Cusco 890, Jesús María, Lima", joinDate: "5 de Enero, 2021" },
    classes: [
      { course: "Educación Física", grade: "3 años", section: "A", schedule: "Lun-Mie 8:00-9:00" },
      { course: "Educación Física", grade: "4 años", section: "A", schedule: "Lun-Mie 9:30-10:30" },
      { course: "Educación Física", grade: "5 años", section: "A", schedule: "Mar-Jue 8:00-9:00" },
      { course: "Educación Física", grade: "1° Primaria", section: "A", schedule: "Mar-Jue 9:30-10:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:00", class: "Ed. Física 3 años A" }, { time: "09:30-10:30", class: "Ed. Física 4 años A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:00", class: "Ed. Física 5 años A" }, { time: "09:30-10:30", class: "Ed. Física 1° Prim A" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:00", class: "Ed. Física 3 años A" }, { time: "09:30-10:30", class: "Ed. Física 4 años A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:00", class: "Ed. Física 5 años A" }, { time: "09:30-10:30", class: "Ed. Física 1° Prim A" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:00", class: "Ed. Física 3 años A" }, { time: "09:30-10:30", class: "Ed. Física 4 años A" }] },
    ],
    metrics: { classesThisWeek: 16, averageAttendance: 97.1, evaluationsRegistered: 15 },
  },
  "6": {
    id: 6, name: "Patricia Campos Rojas", subject: "Inglés", grades: "5 años, 1° Primaria, 2° Primaria", status: "active", avatar: "PC",
    info: { fullName: "Patricia Elena Campos Rojas", dni: "43210987", phone: "+51 932 109 876", email: "pcampos@colegio.edu.pe", address: "Av. La Marina 123, San Miguel, Lima", joinDate: "18 de Abril, 2020" },
    classes: [
      { course: "Inglés", grade: "5 años", section: "A", schedule: "Lun-Mie-Vie 8:00-9:00" },
      { course: "Inglés", grade: "1° Primaria", section: "A", schedule: "Lun-Mie-Vie 9:30-10:30" },
      { course: "Inglés", grade: "2° Primaria", section: "A", schedule: "Mar-Jue 8:00-9:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:00", class: "Inglés 5 años A" }, { time: "09:30-10:30", class: "Inglés 1° Prim A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Inglés 2° Prim A" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:00", class: "Inglés 5 años A" }, { time: "09:30-10:30", class: "Inglés 1° Prim A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Inglés 2° Prim A" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:00", class: "Inglés 5 años A" }, { time: "09:30-10:30", class: "Inglés 1° Prim A" }] },
    ],
    metrics: { classesThisWeek: 11, averageAttendance: 93.7, evaluationsRegistered: 25 },
  },
  "7": {
    id: 7, name: "Fernando Díaz Castro", subject: "Arte y Cultura", grades: "3 años, 4 años, 5 años", status: "active", avatar: "FD",
    info: { fullName: "Fernando Alejandro Díaz Castro", dni: "41098765", phone: "+51 921 098 765", email: "fdiaz@colegio.edu.pe", address: "Calle Los Laureles 456, Pueblo Libre, Lima", joinDate: "12 de Septiembre, 2022" },
    classes: [
      { course: "Arte y Cultura", grade: "3 años", section: "A", schedule: "Lun-Mie 8:00-9:00" },
      { course: "Arte y Cultura", grade: "4 años", section: "A", schedule: "Lun-Mie 9:30-10:30" },
      { course: "Arte y Cultura", grade: "5 años", section: "A", schedule: "Mar-Jue 8:00-9:00" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:00", class: "Arte 3 años A" }, { time: "09:30-10:30", class: "Arte 4 años A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:00", class: "Arte 5 años A" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:00", class: "Arte 3 años A" }, { time: "09:30-10:30", class: "Arte 4 años A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:00", class: "Arte 5 años A" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:00", class: "Arte 3 años A" }, { time: "09:30-10:30", class: "Arte 4 años A" }] },
    ],
    metrics: { classesThisWeek: 9, averageAttendance: 95.4, evaluationsRegistered: 12 },
  },
  "8": {
    id: 8, name: "Gabriela Núñez Vega", subject: "Matemáticas", grades: "5° Primaria, 6° Primaria", status: "active", avatar: "GN",
    info: { fullName: "Gabriela Inés Núñez Vega", dni: "44567891", phone: "+51 910 987 654", email: "gnunez@colegio.edu.pe", address: "Av. Universitaria 789, San Martín de Porres, Lima", joinDate: "28 de Junio, 2023" },
    classes: [
      { course: "Matemática", grade: "5° Primaria", section: "A", schedule: "Lun-Mie-Vie 8:00-9:30" },
      { course: "Matemática", grade: "6° Primaria", section: "A", schedule: "Lun-Mie-Vie 10:00-11:30" },
      { course: "Matemática", grade: "5° Primaria", section: "B", schedule: "Mar-Jue 8:00-9:30" },
    ],
    weeklySchedule: [
      { day: "Lunes", slots: [{ time: "08:00-09:30", class: "Matemática 5° Prim A" }, { time: "10:00-11:30", class: "Matemática 6° Prim A" }] },
      { day: "Martes", slots: [{ time: "08:00-09:30", class: "Matemática 5° Prim B" }] },
      { day: "Miércoles", slots: [{ time: "08:00-09:30", class: "Matemática 5° Prim A" }, { time: "10:00-11:30", class: "Matemática 6° Prim A" }] },
      { day: "Jueves", slots: [{ time: "08:00-09:30", class: "Matemática 5° Prim B" }] },
      { day: "Viernes", slots: [{ time: "08:00-09:30", class: "Matemática 5° Prim A" }, { time: "10:00-11:30", class: "Matemática 6° Prim A" }] },
    ],
    metrics: { classesThisWeek: 10, averageAttendance: 92.6, evaluationsRegistered: 20 },
  },
};

export function useProfesorProfileData(id: string | undefined) {
  const professorFromMap = professorsMap[id ?? ""] ?? null;
  const [professor, setProfessor] = useState<ProfessorProfile | null>(professorFromMap);
  const [loading, setLoading] = useState(isSupabaseEnabled() && !!id);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled() || !id) return;
    setLoading(true);
    setError(null);

    // Fetch all profiles and find the professor by matching the numeric id to the list position
    // or by looking up directly if id is a UUID
    Promise.all([
      authService.getAllUsers(),
      classesService.getAll(),
    ]).then(([profiles, allClasses]) => {
      const professorProfiles = profiles.filter((p) => p.role === "profesor");
      // Try UUID first, then fallback to index-based lookup
      const profile = profiles.find((p) => p.id === id)
        ?? professorProfiles[Number(id) - 1];
      if (!profile) { setLoading(false); return; }

      const teacherClasses = allClasses.filter((c) => c.teacher_id === profile.id);
      const subjects = [...new Set(teacherClasses.map((c) => c.subject))];

      const dayAbbrevMap: Record<string, string> = { Lun: "Lunes", Mar: "Martes", Mie: "Miércoles", Jue: "Jueves", Vie: "Viernes" };
      const allDays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

      // Build weekly schedule from class schedules
      const daySlots: Record<string, Array<{ time: string; class: string }>> = {};
      allDays.forEach((d) => { daySlots[d] = []; });

      teacherClasses.forEach((c) => {
        const sched = c.schedule ?? "";
        const parts = sched.split(" ");
        const daysPart = parts[0] ?? "";
        const timePart = parts.slice(1).join(" ") || "";
        const activeAbbrevs = daysPart.split("-");
        const activeDays = activeAbbrevs.map((abbr) => dayAbbrevMap[abbr] ?? abbr);
        const label = `${c.subject} ${c.grade} ${c.section}`;
        activeDays.forEach((day) => {
          if (daySlots[day]) daySlots[day].push({ time: timePart, class: label });
        });
      });

      const weeklySchedule = allDays.map((day) => ({ day, slots: daySlots[day] }));

      const derivedSubjects = subjects.join(", ");
      const derivedGrades = [...new Set(teacherClasses.map((c) => `${c.grade} ${c.section}`))].join(", ");
      const cleanSpecializations = profile.specializations?.split(", ").filter((s) => s && s !== "Sin asignar").join(", ") || "";
      const cleanGrades = profile.assigned_grades?.split(", ").filter((s) => s && s !== "Sin asignar").join(", ") || "";

      const mapped: ProfessorProfile = {
        id: Number(id),
        name: profile.name,
        subject: cleanSpecializations || derivedSubjects || "Sin asignar",
        grades: cleanGrades || derivedGrades || "Sin asignar",
        status: profile.status as string,
        avatar: profile.avatar ?? profile.name.substring(0, 2).toUpperCase(),
        info: {
          fullName: profile.name,
          dni: "",
          phone: profile.phone ?? "",
          email: profile.email ?? "",
          address: profile.address ?? "",
          joinDate: new Date(profile.created_at).toLocaleDateString("es-PE", { year: "numeric", month: "long", day: "numeric" }),
        },
        classes: teacherClasses.map((c) => ({
          course: c.subject,
          grade: c.grade,
          section: c.section,
          schedule: c.schedule ?? "",
        })),
        weeklySchedule,
        metrics: {
          classesThisWeek: teacherClasses.length * 3,
          averageAttendance: 94.0,
          evaluationsRegistered: teacherClasses.length * 4,
        },
      };

      setProfessor(mapped);
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, [id]);

  const updateProfessor = useCallback((updates: Omit<Partial<ProfessorProfile>, 'info'> & { info?: Partial<ProfessorInfo> }) => {
    setProfessor((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        info: updates.info ? { ...prev.info, ...updates.info } : prev.info,
      };
    });

    // Persist name changes to Supabase
    if (isSupabaseEnabled() && supabase && updates.name) {
      // Would need the UUID to update; for now local state is updated
    }
  }, []);

  const toggleStatus = useCallback(() => {
    setProfessor((prev) => {
      if (!prev) return prev;
      return { ...prev, status: prev.status === "active" ? "inactive" : "active" };
    });
  }, []);

  return { professor, setProfessor, loading, error, updateProfessor, toggleStatus };
}
