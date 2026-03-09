/**
 * Attendance Service
 * Record and query attendance data.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { AttendanceRecord, AttendanceSummary } from "../types/database";

type AttendanceInsert = Omit<AttendanceRecord, "id" | "created_at" | "updated_at">;

async function getSummaryByDate(date: string): Promise<AttendanceSummary[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("attendance_summary")
    .select("*")
    .eq("date", date)
    .order("grade");
  if (error) { console.error("attendance.getSummary:", error); return []; }
  return data;
}

async function getByClassAndDate(classId: number, date: string): Promise<AttendanceRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("attendance")
    .select("*")
    .eq("class_id", classId)
    .eq("date", date);
  return data ?? [];
}

async function upsertBatch(records: AttendanceInsert[]): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("attendance")
    .upsert(records, { onConflict: "class_id,student_id,date" });
  return error?.message ?? null;
}

async function getStudentHistory(studentId: number, fromDate?: string, toDate?: string): Promise<AttendanceRecord[]> {
  if (!supabase) return [];
  let query = supabase
    .from("attendance")
    .select("*")
    .eq("student_id", studentId)
    .order("date", { ascending: false });
  if (fromDate) query = query.gte("date", fromDate);
  if (toDate) query = query.lte("date", toDate);
  const { data } = await query;
  return data ?? [];
}

export const attendanceService = {
  isEnabled: isSupabaseEnabled,
  getSummaryByDate,
  getByClassAndDate,
  upsertBatch,
  getStudentHistory,
};
