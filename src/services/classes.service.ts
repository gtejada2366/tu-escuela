/**
 * Classes Service
 * CRUD for classes, enrollments, and class views.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { ClassRecord, ClassView, Enrollment } from "../types/database";

export type ClassInsert = Omit<ClassRecord, "id" | "created_at" | "updated_at">;
export type ClassUpdate = Partial<Omit<ClassRecord, "id" | "created_at" | "updated_at">>;

async function getAll(): Promise<ClassView[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("classes_view")
    .select("*")
    .order("grade");
  if (error) { console.error("classes.getAll:", error); return []; }
  return data;
}

async function getByTeacher(teacherId: string): Promise<ClassView[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("classes_view")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("grade");
  return data ?? [];
}

async function getById(id: number): Promise<ClassView | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("classes_view")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function create(cls: ClassInsert): Promise<{ data: ClassRecord | null; error: string | null }> {
  if (!supabase) return { data: null, error: "Supabase no configurado" };
  const { data, error } = await supabase
    .from("classes")
    .insert(cls)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

async function update(id: number, changes: ClassUpdate): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("classes").update(changes).eq("id", id);
  // If grade_config column doesn't exist yet, retry without it
  if (error && error.message?.includes("grade_config")) {
    const { grade_config: _, ...rest } = changes;
    if (Object.keys(rest).length === 0) return null; // only grade_config was being updated
    const { error: err2 } = await supabase.from("classes").update(rest).eq("id", id);
    return err2?.message ?? null;
  }
  return error?.message ?? null;
}

async function remove(id: number): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("classes").delete().eq("id", id);
  return error?.message ?? null;
}

// ── Enrollments ──────────────────────────────────────────────

async function getEnrollments(classId: number): Promise<Array<Enrollment & { student_name: string }>> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("enrollments")
    .select("*, students(name)")
    .eq("class_id", classId);
  return (data ?? []).map((e: any) => ({
    ...e,
    student_name: e.students?.name ?? "",
  }));
}

async function enrollStudent(classId: number, studentId: number): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("enrollments").insert({ class_id: classId, student_id: studentId });
  return error?.message ?? null;
}

async function unenrollStudent(classId: number, studentId: number): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("enrollments")
    .delete()
    .eq("class_id", classId)
    .eq("student_id", studentId);
  return error?.message ?? null;
}

export const classesService = {
  isEnabled: isSupabaseEnabled,
  getAll,
  getByTeacher,
  getById,
  create,
  update,
  remove,
  getEnrollments,
  enrollStudent,
  unenrollStudent,
};
