import { useState, useEffect, useCallback } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";

export interface AppNotification {
  id: number;
  type: "payment_due" | "grade_posted" | "attendance_alert" | "info";
  title: string;
  description: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// Demo notifications generated from current context
function buildDemoNotifications(): AppNotification[] {
  const now = new Date();
  const fmt = (daysAgo: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString();
  };

  return [
    { id: 1, type: "payment_due", title: "Pago vencido", description: "Diego Ramírez Silva tiene un pago vencido de S/ 450", link: "/pagos", isRead: false, createdAt: fmt(0) },
    { id: 2, type: "attendance_alert", title: "Baja asistencia detectada", description: "Diego Ramírez Silva registra 89.3% de asistencia", link: "/asistencia", isRead: false, createdAt: fmt(0) },
    { id: 3, type: "grade_posted", title: "Calificaciones actualizadas", description: "Se registraron notas para 3° Primaria A", link: "/calificaciones", isRead: false, createdAt: fmt(1) },
    { id: 4, type: "info", title: "Nueva matrícula", description: "Santiago Morales Cruz fue matriculado en 3° Primaria A", link: "/estudiantes/8", isRead: true, createdAt: fmt(2) },
    { id: 5, type: "payment_due", title: "Pagos pendientes", description: "Isabella Vargas Díaz tiene un pago pendiente", link: "/pagos", isRead: true, createdAt: fmt(3) },
  ];
}

function timeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Hace ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ayer";
  return `Hace ${diffDays} días`;
}

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase || !userId) {
      setNotifications(buildDemoNotifications());
      setLoading(false);
      return;
    }

    // Notifications table not yet in schema — use demo data for now
    // When the table is added to Supabase, query it here
    setNotifications(buildDemoNotifications());
    setLoading(false);
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((_id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === _id ? { ...n, isRead: true } : n))
    );
    // When notifications table exists, persist here
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const getTimeAgo = useCallback((isoDate: string) => timeAgo(isoDate), []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, getTimeAgo };
}
