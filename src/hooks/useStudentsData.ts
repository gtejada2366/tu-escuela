import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { studentsService } from "../services/students.service";

export interface StudentLocal {
  id: number;
  name: string;
  grade: string;
  section: string;
  parent: string;
  paymentStatus: string;
  attendance: number;
  avatar: string;
  phone: string;
  address: string;
}

function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const demoStudents: StudentLocal[] = [
  { id: 1, name: "María González Pérez", grade: "5° Primaria", section: "A", parent: "Carlos González", paymentStatus: "paid", attendance: 96.5, avatar: "MG", phone: "+51 987 654 321", address: "Av. Los Olivos 234, San Isidro" },
  { id: 2, name: "Juan Pérez Rodríguez", grade: "4° Primaria", section: "B", parent: "Ana Rodríguez", paymentStatus: "paid", attendance: 94.2, avatar: "JP", phone: "+51 976 543 210", address: "Jr. Las Flores 567, Miraflores" },
  { id: 3, name: "Sofía Martínez López", grade: "3° Secundaria", section: "A", parent: "Roberto Martínez", paymentStatus: "pending", attendance: 98.1, avatar: "SM", phone: "+51 965 432 109", address: "Calle Los Pinos 890, Surco" },
  { id: 4, name: "Diego Ramírez Silva", grade: "2° Secundaria", section: "B", parent: "Patricia Silva", paymentStatus: "overdue", attendance: 89.3, avatar: "DR", phone: "+51 954 321 098", address: "Av. Primavera 123, San Borja" },
  { id: 5, name: "Valentina Torres Castro", grade: "4 años", section: "A", parent: "Luis Torres", paymentStatus: "paid", attendance: 97.8, avatar: "VT", phone: "+51 943 210 987", address: "Jr. Los Cedros 456, La Molina" },
  { id: 6, name: "Mateo Flores Ruiz", grade: "1° Secundaria", section: "A", parent: "Carmen Flores", paymentStatus: "paid", attendance: 91.5, avatar: "MF", phone: "+51 932 109 876", address: "Av. Javier Prado 789, Magdalena" },
  { id: 7, name: "Isabella Vargas Díaz", grade: "5 años", section: "B", parent: "Fernando Vargas", paymentStatus: "pending", attendance: 95.2, avatar: "IV", phone: "+51 921 098 765", address: "Calle Las Palmeras 321, Jesús María" },
  { id: 8, name: "Santiago Morales Cruz", grade: "3° Primaria", section: "A", parent: "Elena Morales", paymentStatus: "paid", attendance: 93.7, avatar: "SC", phone: "+51 910 987 654", address: "Av. Brasil 654, Pueblo Libre" },
];

export function useStudentsData() {
  const [students, setStudents] = useState<StudentLocal[]>(demoStudents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) return;
    setLoading(true);
    setError(null);

    Promise.all([
      studentsService.getAll(),
      supabase.from("payments").select("student_id, status"),
      supabase.from("attendance").select("student_id, status"),
    ]).then(([data, paymentsResult, attendanceResult]) => {
      if (data.length > 0) {
        // Build payment status map: worst status per student (overdue > pending > paid)
        const paymentMap: Record<number, string> = {};
        for (const p of paymentsResult.data ?? []) {
          const cur = paymentMap[p.student_id];
          if (!cur || p.status === "overdue" || (p.status === "pending" && cur !== "overdue")) {
            paymentMap[p.student_id] = p.status;
          }
        }

        // Build attendance percentage map
        const attMap: Record<number, { total: number; present: number }> = {};
        for (const a of attendanceResult.data ?? []) {
          if (!attMap[a.student_id]) attMap[a.student_id] = { total: 0, present: 0 };
          attMap[a.student_id].total++;
          if (a.status === "present" || a.status === "late") attMap[a.student_id].present++;
        }

        setStudents(data.map((s) => {
          const att = attMap[s.id];
          return {
            id: s.id,
            name: s.name,
            grade: s.grade,
            section: s.section,
            parent: s.parent_name ?? "",
            paymentStatus: paymentMap[s.id] ?? "paid",
            attendance: att ? parseFloat(((att.present / att.total) * 100).toFixed(1)) : 100,
            avatar: generateAvatar(s.name),
            phone: s.parent_phone ?? "",
            address: s.address ?? "",
          };
        }));
      }
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, []);

  const addStudent = useCallback(async (student: Omit<StudentLocal, "id" | "avatar">) => {
    if (isSupabaseEnabled()) {
      const { data } = await studentsService.create({
        name: student.name,
        grade: student.grade,
        section: student.section,
        parent_name: student.parent,
        parent_phone: student.phone,
        address: student.address,
        status: "active",
        academic_year_id: null,
        parent_email: null,
      });
      if (data) {
        setStudents((prev) => [...prev, {
          ...student,
          id: data.id,
          avatar: generateAvatar(student.name),
        }]);
      }
    } else {
      const newId = Math.max(0, ...students.map((s) => s.id)) + 1;
      setStudents((prev) => [...prev, { ...student, id: newId, avatar: generateAvatar(student.name) }]);
    }
  }, [students]);

  const updateStudent = useCallback(async (id: number, changes: Partial<StudentLocal>) => {
    if (isSupabaseEnabled()) {
      await studentsService.update(id, {
        ...(changes.name && { name: changes.name }),
        ...(changes.grade && { grade: changes.grade }),
        ...(changes.section && { section: changes.section }),
        ...(changes.parent && { parent_name: changes.parent }),
        ...(changes.phone && { parent_phone: changes.phone }),
        ...(changes.address && { address: changes.address }),
      });
    }
    setStudents((prev) => prev.map((s) => {
      if (s.id !== id) return s;
      const updated = { ...s, ...changes };
      if (changes.name) updated.avatar = generateAvatar(changes.name);
      return updated;
    }));
  }, []);

  const removeStudent = useCallback(async (id: number) => {
    if (isSupabaseEnabled()) await studentsService.remove(id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return { students, setStudents, loading, error, addStudent, updateStudent, removeStudent, generateAvatar };
}
