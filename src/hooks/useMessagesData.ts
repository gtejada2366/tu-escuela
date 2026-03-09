import { useState, useEffect, useCallback, useRef } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
import { messagesService } from "../services/messages.service";
import { useAuth } from "../contexts/AuthContext";

export interface MessageLocal {
  id: number;
  sender: string;
  senderRole: string;
  avatar: string;
  subject: string;
  preview: string;
  content: string;
  date: string;
  time: string;
  unread: boolean;
  category: string;
  recipients: string[];
  attachments?: Array<{ name: string; type: string; size: string }>;
}

const demoMessages: MessageLocal[] = [
  { id: 1, sender: "Prof. Carlos Mendoza", senderRole: "Profesor de Matemáticas", avatar: "CM", subject: "Reunión de coordinación - 5° Primaria", preview: "Estimados padres, les escribo para coordinar la reunión bimestral...", content: "Estimados padres de familia,\n\nLes escribo para coordinar la reunión bimestral del 5° Primaria A. La reunión se llevará a cabo el próximo viernes 15 de marzo a las 3:00 PM en el auditorio principal.\n\nTemas a tratar:\n- Avances académicos del bimestre\n- Próximos eventos escolares\n- Tareas pendientes\n\nAgradezco confirmar su asistencia.\n\nSaludos cordiales,\nProf. Carlos Mendoza", date: "Hoy", time: "10:30 AM", unread: true, category: "inbox", recipients: ["Padres de 5° Primaria A"] },
  { id: 2, sender: "Dirección Académica", senderRole: "Administración", avatar: "DA", subject: "Suspensión de clases - 10 de Marzo", preview: "Estimada comunidad educativa, informamos que el día 10 de marzo...", content: "Estimada comunidad educativa,\n\nInformamos que el día 10 de marzo no habrá clases debido a actividades de capacitación docente.\n\nLas clases se reanudarán normalmente el día 11 de marzo.\n\nGracias por su comprensión.\n\nAtentamente,\nDirección Académica", date: "Ayer", time: "4:15 PM", unread: true, category: "announcements", recipients: ["Toda la comunidad"], attachments: [{ name: "comunicado-oficial.pdf", type: "pdf", size: "245 KB" }] },
  { id: 3, sender: "Ana Rodríguez (Mamá de Juan)", senderRole: "Padre de familia", avatar: "AR", subject: "Consulta sobre tareas de matemáticas", preview: "Buenos días profesor, tengo una consulta sobre las tareas...", content: "Buenos días profesor,\n\nTengo una consulta sobre las tareas de matemáticas de esta semana. Mi hijo Juan no entiende muy bien el tema de fracciones.\n\n¿Podría darle una tutoría adicional?\n\nGracias,\nAna Rodríguez", date: "05/03/2026", time: "2:45 PM", unread: false, category: "inbox", recipients: ["Prof. Carlos Mendoza"] },
  { id: 4, sender: "Prof. María López", senderRole: "Profesora de Comunicación", avatar: "ML", subject: "Material de lectura - 3° Primaria", preview: "Adjunto el material de lectura para la próxima semana...", content: "Estimados padres,\n\nAdjunto el material de lectura que los estudiantes deberán leer durante la próxima semana.\n\nPor favor, ayuden a sus hijos a completar la ficha de comprensión lectora.\n\nSaludos,\nProf. María López", date: "04/03/2026", time: "11:20 AM", unread: false, category: "course", recipients: ["Padres de 3° Primaria A"], attachments: [{ name: "lectura-semana-10.pdf", type: "pdf", size: "1.2 MB" }, { name: "ficha-comprension.pdf", type: "pdf", size: "456 KB" }] },
  { id: 5, sender: "Secretaría Académica", senderRole: "Administración", avatar: "SA", subject: "Recordatorio: Pago de pensión de Marzo", preview: "Estimados padres, les recordamos que el pago de la pensión...", content: "Estimados padres de familia,\n\nLes recordamos que el pago de la pensión del mes de marzo vence el día 15 del presente mes.\n\nPueden realizar el pago a través de:\n- Transferencia bancaria\n- Pago en secretaría\n- Pago en línea (próximamente)\n\nGracias por su puntualidad.\n\nSecretaría Académica", date: "03/03/2026", time: "9:00 AM", unread: false, category: "announcements", recipients: ["Todos los padres"] },
];

export function useMessagesData() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<MessageLocal[]>(demoMessages);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSupabaseEnabled() || !user?.uid) return;
    setLoading(true);
    setError(null);
    Promise.all([
      messagesService.getInbox(user.uid),
      messagesService.getSent(user.uid),
    ]).then(([inbox, sent]) => {
      const all = [...inbox, ...sent].map((m) => ({
        id: m.id,
        sender: m.sender_name,
        senderRole: m.sender_role,
        avatar: m.sender_avatar,
        subject: m.subject,
        preview: m.content.slice(0, 80),
        content: m.content,
        date: new Date(m.created_at).toLocaleDateString("es-PE"),
        time: new Date(m.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }),
        unread: (m.recipients ?? []).some((r) => r.recipient_id === user.uid && !r.is_read),
        category: m.sender_id === user.uid ? "sent" : m.category,
        recipients: (m.recipients ?? []).map((r) => r.recipient_label),
        attachments: (m.attachments ?? []).map((a) => ({ name: a.file_name, type: a.file_type ?? "file", size: a.file_size ?? "" })),
      }));
      if (all.length > 0) setConversations(all);
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, [user]);

  const sendMessage = useCallback(async (params: {
    recipient: string;
    subject: string;
    body: string;
    attachments: Array<{ name: string; type: string; size: string }>;
  }) => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const timeStr = `${displayHours}:${minutes} ${ampm}`;

    if (isSupabaseEnabled() && user?.uid) {
      await messagesService.send({
        senderId: user.uid,
        subject: params.subject || "(Sin asunto)",
        content: params.body || "(Sin contenido)",
        recipients: [{ type: "group", label: params.recipient || "Destinatario" }],
      });
    }

    const newMessage: MessageLocal = {
      id: Date.now(),
      sender: "Yo",
      senderRole: "Usuario",
      avatar: "YO",
      subject: params.subject || "(Sin asunto)",
      preview: params.body.slice(0, 80) || "(Sin contenido)",
      content: params.body || "(Sin contenido)",
      date: "Hoy",
      time: timeStr,
      unread: false,
      category: "sent",
      recipients: [params.recipient || "Destinatario"],
      attachments: params.attachments.length > 0 ? params.attachments : undefined,
    };
    setConversations((prev) => [newMessage, ...prev]);
  }, [user]);

  const archiveMessage = useCallback((id: number) => {
    setConversations((prev) => prev.filter((msg) => msg.id !== id));
  }, []);

  return { conversations, setConversations, loading, error, sendMessage, archiveMessage, fileInputRef, imageInputRef };
}
