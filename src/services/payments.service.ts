/**
 * Payments Service
 * CRUD for payment records.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { PaymentRecord, PaymentSummaryView } from "../types/database";

type PaymentInsert = Omit<PaymentRecord, "id" | "school_id" | "created_at" | "updated_at">;
type PaymentUpdate = Partial<Pick<PaymentRecord, "status" | "paid_date" | "amount" | "due_date">>;

async function getAll(): Promise<PaymentSummaryView[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("payment_summary")
    .select("*")
    .order("due_date", { ascending: false });
  if (error) { console.error("payments.getAll:", error); return []; }
  return data;
}

async function getByStudent(studentId: number): Promise<PaymentRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("payments")
    .select("*")
    .eq("student_id", studentId)
    .order("due_date", { ascending: false });
  return data ?? [];
}

async function create(payment: PaymentInsert): Promise<{ data: PaymentRecord | null; error: string | null }> {
  if (!supabase) return { data: null, error: "Supabase no configurado" };
  const { data, error } = await supabase
    .from("payments")
    .insert(payment)
    .select()
    .single();
  return { data, error: error?.message ?? null };
}

async function registerPayment(id: number, paidDate: string): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase
    .from("payments")
    .update({ status: "paid" as const, paid_date: paidDate })
    .eq("id", id);
  return error?.message ?? null;
}

async function update(id: number, changes: PaymentUpdate): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("payments").update(changes).eq("id", id);
  return error?.message ?? null;
}

async function getSummaryStats(): Promise<{ paid: number; pending: number; overdue: number }> {
  if (!supabase) return { paid: 0, pending: 0, overdue: 0 };
  const { data } = await supabase.from("payments").select("status, amount");
  if (!data) return { paid: 0, pending: 0, overdue: 0 };

  return data.reduce(
    (acc, p) => {
      acc[p.status as keyof typeof acc] += Number(p.amount);
      return acc;
    },
    { paid: 0, pending: 0, overdue: 0 }
  );
}

export const paymentsService = {
  isEnabled: isSupabaseEnabled,
  getAll,
  getByStudent,
  create,
  registerPayment,
  update,
  getSummaryStats,
};
