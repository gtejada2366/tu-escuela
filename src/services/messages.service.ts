/**
 * Messages Service
 * Send and retrieve messages with recipients and attachments.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { MessageRecord, MessageRecipient, MessageAttachment } from "../types/database";

export interface FullMessage extends MessageRecord {
  sender_name: string;
  sender_avatar: string;
  sender_role: string;
  recipients: MessageRecipient[];
  attachments: MessageAttachment[];
}

async function getInbox(userId: string): Promise<FullMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("message_recipients")
    .select("message_id")
    .eq("recipient_id", userId);
  if (!data || data.length === 0) return [];

  const messageIds = data.map((r) => r.message_id);
  return fetchMessages(messageIds);
}

async function getSent(userId: string): Promise<FullMessage[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("messages")
    .select("id")
    .eq("sender_id", userId);
  if (!data || data.length === 0) return [];

  return fetchMessages(data.map((m) => m.id));
}

async function fetchMessages(ids: number[]): Promise<FullMessage[]> {
  if (!supabase || ids.length === 0) return [];
  const { data: messages } = await supabase
    .from("messages")
    .select("*, profiles!sender_id(name, avatar, role)")
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (!messages) return [];

  const { data: recipients } = await supabase
    .from("message_recipients")
    .select("*")
    .in("message_id", ids);

  const { data: attachments } = await supabase
    .from("message_attachments")
    .select("*")
    .in("message_id", ids);

  return messages.map((m: any) => ({
    ...m,
    sender_name: m.profiles?.name ?? "Desconocido",
    sender_avatar: m.profiles?.avatar ?? "??",
    sender_role: m.profiles?.role ?? "",
    recipients: (recipients ?? []).filter((r) => r.message_id === m.id),
    attachments: (attachments ?? []).filter((a) => a.message_id === m.id),
  }));
}

interface SendMessageParams {
  senderId: string;
  subject: string;
  content: string;
  category?: string;
  recipients: Array<{ type: "user" | "group" | "grade"; id?: string; label: string }>;
  attachmentFiles?: File[];
}

async function send(params: SendMessageParams): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";

  // 1. Create message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      sender_id: params.senderId,
      subject: params.subject,
      content: params.content,
      category: params.category ?? "sent",
    })
    .select()
    .single();

  if (msgError || !message) return msgError?.message ?? "Error al crear mensaje";

  // 2. Add recipients
  const recipientRows = params.recipients.map((r) => ({
    message_id: message.id,
    recipient_type: r.type,
    recipient_id: r.id ?? null,
    recipient_label: r.label,
    is_read: false,
  }));
  const { error: recError } = await supabase.from("message_recipients").insert(recipientRows);
  if (recError) return recError.message;

  // 3. Upload attachments
  if (params.attachmentFiles && params.attachmentFiles.length > 0) {
    for (const file of params.attachmentFiles) {
      const filePath = `messages/${message.id}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (!uploadError) {
        await supabase.from("message_attachments").insert({
          message_id: message.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(0)} KB` : `${(file.size / 1048576).toFixed(1)} MB`,
          file_type: file.name.split(".").pop() ?? "file",
        });
      }
    }
  }

  return null;
}

async function markAsRead(recipientId: number): Promise<void> {
  if (!supabase) return;
  await supabase.from("message_recipients").update({ is_read: true }).eq("id", recipientId);
}

export const messagesService = {
  isEnabled: isSupabaseEnabled,
  getInbox,
  getSent,
  send,
  markAsRead,
};
