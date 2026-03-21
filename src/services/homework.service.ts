/**
 * Homework Service
 * CRUD for homework assignments.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { HomeworkRecord } from "../types/database";

type HomeworkInsert = Omit<HomeworkRecord, "id" | "school_id" | "created_at" | "updated_at">;
type HomeworkUpdate = Partial<Pick<HomeworkRecord, "title" | "description" | "due_date">>;

async function getByClass(classId: number): Promise<HomeworkRecord[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("homework")
    .select("*")
    .eq("class_id", classId)
    .order("due_date", { ascending: false });
  if (error) { console.error("homework.getByClass:", error); return []; }
  return data;
}

async function create(hw: HomeworkInsert): Promise<{ data: HomeworkRecord | null; error: string | null }> {
  if (!supabase) return { data: null, error: "Supabase no configurado" };
  const { data, error } = await supabase
    .from("homework")
    .insert(hw)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

async function update(id: number, changes: HomeworkUpdate): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("homework").update(changes).eq("id", id);
  return error?.message ?? null;
}

async function remove(id: number): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("homework").delete().eq("id", id);
  return error?.message ?? null;
}

export const homeworkService = {
  isEnabled: isSupabaseEnabled,
  getByClass,
  create,
  update,
  remove,
};
