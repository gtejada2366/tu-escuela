/**
 * Grades Service
 * CRUD for student grades.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { GradeRecord } from "../types/database";

type GradeInsert = Omit<GradeRecord, "id" | "average" | "created_at" | "updated_at">;
type GradeUpdate = Partial<Pick<GradeRecord, "exam1" | "exam2" | "homework" | "participation">>;

async function getByClass(classId: number, period?: string): Promise<Array<GradeRecord & { student_name: string }>> {
  if (!supabase) return [];
  let query = supabase
    .from("grades")
    .select("*, students(name)")
    .eq("class_id", classId);
  if (period) query = query.eq("period", period);
  const { data } = await query.order("student_id");
  return (data ?? []).map((g: any) => ({
    ...g,
    student_name: g.students?.name ?? "",
  }));
}

async function getByStudent(studentId: number): Promise<GradeRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("grades")
    .select("*")
    .eq("student_id", studentId)
    .order("period");
  return data ?? [];
}

async function upsert(record: GradeInsert): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("grades")
    .upsert(record, { onConflict: "class_id,student_id,period" });
  return error?.message ?? null;
}

async function updateGrade(id: number, changes: GradeUpdate): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("grades").update(changes).eq("id", id);
  return error?.message ?? null;
}

export const gradesService = {
  isEnabled: isSupabaseEnabled,
  getByClass,
  getByStudent,
  upsert,
  updateGrade,
};
