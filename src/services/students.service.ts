/**
 * Students Service
 * CRUD operations for students — Supabase when configured, demo data otherwise.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Student } from "../types/database";

export type StudentInsert = Omit<Student, "id" | "school_id" | "created_at" | "updated_at">;
export type StudentUpdate = Partial<Omit<Student, "id" | "school_id" | "created_at" | "updated_at">>;

async function getAll(): Promise<Student[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .order("name");
  if (error) { console.error("students.getAll:", error); return []; }
  return data;
}

async function getById(id: number): Promise<Student | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("students")
    .select("*")
    .eq("id", id)
    .single();
  return data;
}

async function getByGrade(grade: string, section?: string): Promise<Student[]> {
  if (!supabase) return [];
  let query = supabase.from("students").select("*").eq("grade", grade);
  if (section) query = query.eq("section", section);
  const { data } = await query.order("name");
  return data ?? [];
}

async function create(student: StudentInsert): Promise<{ data: Student | null; error: string | null }> {
  if (!supabase) return { data: null, error: "Supabase no configurado" };
  const { data, error } = await supabase
    .from("students")
    .insert(student)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

async function update(id: number, changes: StudentUpdate): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("students")
    .update(changes)
    .eq("id", id);
  return error?.message ?? null;
}

async function remove(id: number): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("students")
    .delete()
    .eq("id", id);
  return error?.message ?? null;
}

async function count(): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("students")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");
  if (error) return 0;
  return count ?? 0;
}

export const studentsService = {
  isEnabled: isSupabaseEnabled,
  getAll,
  getById,
  getByGrade,
  create,
  update,
  remove,
  count,
};
