import { useState, useEffect, useCallback, useMemo } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
import { paymentsService } from "../services/payments.service";

export interface PaymentLocal {
  id: number;
  student: string;
  grade: string;
  amount: number;
  dueDate: string;
  paidDate: string;
  status: "paid" | "pending" | "overdue";
}

function dmyDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function buildDemoPayments(): PaymentLocal[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0-indexed
  const curDue = dmyDate(new Date(y, m, 1));
  const prevDue = dmyDate(new Date(y, m - 1, 1));
  // Simulated paid dates: a few days into the current month
  const paid = (day: number) => dmyDate(new Date(y, m, day));
  const paidPrev = dmyDate(new Date(y, m - 1, 28));

  return [
    { id: 1, student: "María González Pérez", grade: "5° Primaria A", amount: 450, dueDate: curDue, paidDate: paidPrev, status: "paid" },
    { id: 2, student: "Juan Pérez Rodríguez", grade: "4° Primaria B", amount: 450, dueDate: curDue, paidDate: paid(1), status: "paid" },
    { id: 3, student: "Sofía Martínez López", grade: "3° Secundaria A", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 4, student: "Diego Ramírez Silva", grade: "2° Secundaria B", amount: 450, dueDate: prevDue, paidDate: "-", status: "overdue" },
    { id: 5, student: "Valentina Torres Castro", grade: "4 años A", amount: 350, dueDate: curDue, paidDate: paid(5), status: "paid" },
    { id: 6, student: "Mateo Flores Ruiz", grade: "1° Secundaria A", amount: 450, dueDate: curDue, paidDate: paid(2), status: "paid" },
    { id: 7, student: "Isabella Vargas Díaz", grade: "5 años B", amount: 350, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 8, student: "Sebastián Morales Ríos", grade: "1° Primaria A", amount: 450, dueDate: curDue, paidDate: paid(3), status: "paid" },
    { id: 9, student: "Camila Herrera Ortiz", grade: "6° Primaria B", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 10, student: "Alejandro Soto Méndez", grade: "2° Primaria B", amount: 450, dueDate: prevDue, paidDate: "-", status: "overdue" },
    { id: 11, student: "Luciana Castro Paredes", grade: "5° Primaria A", amount: 450, dueDate: curDue, paidDate: paid(1), status: "paid" },
    { id: 12, student: "Emilio Guzmán Vega", grade: "3° Primaria A", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 13, student: "Renata Delgado Cruz", grade: "4° Primaria A", amount: 450, dueDate: curDue, paidDate: paid(4), status: "paid" },
    { id: 14, student: "Nicolás Peña Romero", grade: "4° Secundaria A", amount: 450, dueDate: prevDue, paidDate: "-", status: "overdue" },
    { id: 15, student: "Antonella Ríos Luna", grade: "3 años B", amount: 350, dueDate: curDue, paidDate: paid(2), status: "paid" },
    { id: 16, student: "Gabriel Navarro Campos", grade: "2° Primaria A", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 17, student: "Mariana León Salazar", grade: "5° Secundaria B", amount: 450, dueDate: curDue, paidDate: paid(6), status: "paid" },
    { id: 18, student: "Daniel Aguilar Ponce", grade: "4° Primaria B", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
    { id: 19, student: "Victoria Medina Torres", grade: "3° Secundaria B", amount: 450, dueDate: prevDue, paidDate: "-", status: "overdue" },
    { id: 20, student: "Tomás Reyes Figueroa", grade: "6° Primaria A", amount: 450, dueDate: curDue, paidDate: paid(1), status: "paid" },
    { id: 21, student: "Paula Jiménez Bravo", grade: "1° Primaria A", amount: 450, dueDate: curDue, paidDate: "-", status: "pending" },
  ];
}

const demoPayments: PaymentLocal[] = buildDemoPayments();

function formatDateDMY(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export function usePaymentsData() {
  const [payments, setPayments] = useState<PaymentLocal[]>(() =>
    isSupabaseEnabled() ? [] : demoPayments
  );
  const [loading, setLoading] = useState(isSupabaseEnabled());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    setError(null);
    paymentsService.getAll().then((data) => {
      setPayments(data.map((p) => ({
        id: p.id,
        student: p.student_name,
        grade: `${p.student_grade} ${p.student_section}`,
        amount: Number(p.amount),
        dueDate: formatDateDMY(p.due_date),
        paidDate: formatDateDMY(p.paid_date),
        status: p.status,
      })));
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, []);

  const registerPayment = useCallback(async (id: number) => {
    const now = new Date();
    const todayStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    if (isSupabaseEnabled()) {
      await paymentsService.registerPayment(id, todayISO);
    }
    setPayments((prev) =>
      prev.map((p) => p.id === id ? { ...p, status: "paid" as const, paidDate: todayStr } : p)
    );
  }, []);

  const totalPaid = useMemo(() => payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0), [payments]);
  const totalPending = useMemo(() => payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0), [payments]);
  const totalOverdue = useMemo(() => payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0), [payments]);

  return { payments, setPayments, loading, error, registerPayment, totalPaid, totalPending, totalOverdue };
}
