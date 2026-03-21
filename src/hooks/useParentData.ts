import { useState, useEffect } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

export interface ParentChild {
  id: number;
  name: string;
  avatar: string;
  grade: string;
  section: string;
  attendance: number;
  avgGrade: number;
  paymentStatus: "paid" | "pending" | "overdue";
  pendingAmount: number;
}

export interface ParentChildDetail {
  id: number;
  name: string;
  avatar: string;
  code: string;
  grade: string;
  section: string;
  birthDate: string;
  address: string;
  attendance: number;
  avgGrade: number;
  attendanceHistory: { month: string; percentage: number }[];
  gradesData: { subject: string; grade: number }[];
  paymentsHistory: { id: number; month: string; amount: string; status: "paid" | "pending" | "overdue"; date: string }[];
}

// Demo data — matches demo students whose parent_email would be the parent's login email
const demoChildren: ParentChild[] = [
  { id: 1, name: "María González Pérez", avatar: "MG", grade: "5° Primaria", section: "A", attendance: 96.5, avgGrade: 17.0, paymentStatus: "paid", pendingAmount: 0 },
  { id: 2, name: "Juan Pérez Rodríguez", avatar: "JP", grade: "4° Primaria", section: "B", attendance: 94.2, avgGrade: 16.5, paymentStatus: "paid", pendingAmount: 0 },
];

function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

export function useParentData(parentEmail: string) {
  const [children, setChildren] = useState<ParentChild[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase) {
      setChildren(demoChildren);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Find students linked to this parent's email
    const sb = supabase;
    (async () => {
      try {
        const { data: students, error: err } = await sb
          .from("students")
          .select("*")
          .eq("parent_email", parentEmail)
          .eq("status", "active")
          .order("name");

        if (err) {
          setError("Error al cargar datos de sus hijos");
          setLoading(false);
          return;
        }

        if (!students || students.length === 0) {
          setChildren([]);
          setLoading(false);
          return;
        }

        const studentIds = students.map((s) => s.id);

        const [paymentsRes, attendanceRes, gradesRes] = await Promise.all([
          sb.from("payments").select("student_id, status, amount").in("student_id", studentIds),
          sb.from("attendance").select("student_id, status").in("student_id", studentIds),
          sb.from("grades").select("student_id, average").in("student_id", studentIds),
        ]);

        const payments = paymentsRes.data;
        const attendance = attendanceRes.data;
        const grades = gradesRes.data;

        const result: ParentChild[] = students.map((s) => {
          const studentAtt = (attendance ?? []).filter((a) => a.student_id === s.id);
          const totalAtt = studentAtt.length;
          const presentAtt = studentAtt.filter((a) => a.status === "present").length;
          const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 1000) / 10 : 100;

          const studentGrades = (grades ?? []).filter((g) => g.student_id === s.id);
          const avgGrade = studentGrades.length > 0
            ? Math.round((studentGrades.reduce((sum, g) => sum + (g.average ?? 0), 0) / studentGrades.length) * 10) / 10
            : 0;

          const studentPayments = (payments ?? []).filter((p) => p.student_id === s.id);
          const hasOverdue = studentPayments.some((p) => p.status === "overdue");
          const hasPending = studentPayments.some((p) => p.status === "pending");
          const pendingAmount = studentPayments
            .filter((p) => p.status === "pending" || p.status === "overdue")
            .reduce((sum, p) => sum + (p.amount ?? 0), 0);

          return {
            id: s.id,
            name: s.name,
            avatar: generateAvatar(s.name),
            grade: s.grade,
            section: s.section,
            attendance: attPct,
            avgGrade,
            paymentStatus: hasOverdue ? "overdue" : hasPending ? "pending" : "paid",
            pendingAmount,
          };
        });

        setChildren(result);
        setLoading(false);
      } catch {
        setError("Error de conexión");
        setLoading(false);
      }
    })();
  }, [parentEmail]);

  return { children, loading, error };
}
