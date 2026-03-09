import { useState, useEffect } from "react";
import { Inbox, Send, Megaphone, BookOpen, Archive, Plus, Search, Paperclip, Image as ImageIcon, File, X, Reply, Forward, Menu, ChevronLeft } from "lucide-react";
import { useToast } from "../components/Toast";
import { useMessagesData, type MessageLocal } from "../hooks/useMessagesData";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { UnsavedChangesGuard } from "../components/UnsavedChangesGuard";

const navItems = [
  { icon: Inbox, label: "Bandeja de entrada", value: "inbox", badge: 2 },
  { icon: Send, label: "Enviados", value: "sent", badge: 0 },
  { icon: Megaphone, label: "Anuncios", value: "announcements", badge: 2 },
  { icon: BookOpen, label: "Por curso", value: "course", badge: 0 },
  { icon: Archive, label: "Archivados", value: "archived", badge: 0 },
];

export function Mensajeria() {
  const { showToast } = useToast();
  const { conversations, loading, error, sendMessage, archiveMessage, fileInputRef, imageInputRef } = useMessagesData();

  useEffect(() => { if (error) showToast(error, "error"); }, [error]);
  const [selectedCategory, setSelectedCategory] = useState("inbox");
  const [selectedMessage, setSelectedMessage] = useState<MessageLocal | null>(conversations[0] ?? null);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileMessage, setShowMobileMessage] = useState(false);
  const [newMsgRecipient, setNewMsgRecipient] = useState("");
  const [newMsgSubject, setNewMsgSubject] = useState("");
  const [newMsgBody, setNewMsgBody] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMsgAttachments, setNewMsgAttachments] = useState<Array<{ name: string; type: string; size: string }>>([]);

  const isDirty = showNewMessage && (newMsgRecipient.length > 0 || newMsgSubject.length > 0 || newMsgBody.length > 0 || newMsgAttachments.length > 0);

  if (loading) return <LoadingSpinner />;

  const filteredMessages = conversations.filter((msg) => {
    if (msg.category !== selectedCategory) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return msg.sender.toLowerCase().includes(q) || msg.subject.toLowerCase().includes(q) || msg.preview.toLowerCase().includes(q);
  });

  const handleReply = () => {
    if (!selectedMessage) return;
    setNewMsgRecipient(selectedMessage.sender);
    setNewMsgSubject("Re: " + selectedMessage.subject);
    setNewMsgBody("");
    setShowNewMessage(true);
  };

  const handleForward = () => {
    if (!selectedMessage) return;
    setNewMsgRecipient("");
    setNewMsgSubject("Fwd: " + selectedMessage.subject);
    setNewMsgBody(`\n\n--- Mensaje reenviado ---\nDe: ${selectedMessage.sender}\nFecha: ${selectedMessage.date} ${selectedMessage.time}\n\n${selectedMessage.content}`);
    setShowNewMessage(true);
  };

  const handleArchive = () => {
    if (!selectedMessage) return;
    archiveMessage(selectedMessage.id);
    setSelectedMessage(null);
    setShowMobileMessage(false);
    showToast("Conversación archivada");
  };

  const handleDownload = () => {
    showToast("Archivo descargado exitosamente");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = Array.from(files).map((f) => ({
      name: f.name,
      type: f.name.split(".").pop() ?? "file",
      size: f.size < 1024 ? `${f.size} B` : f.size < 1048576 ? `${(f.size / 1024).toFixed(0)} KB` : `${(f.size / 1048576).toFixed(1)} MB`,
    }));
    setNewMsgAttachments((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const handleSendMessage = async () => {
    try {
      await sendMessage({
        recipient: newMsgRecipient,
        subject: newMsgSubject,
        body: newMsgBody,
        attachments: newMsgAttachments,
      });
      showToast("Mensaje enviado exitosamente");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowNewMessage(false);
    setNewMsgRecipient("");
    setNewMsgSubject("");
    setNewMsgBody("");
    setNewMsgAttachments([]);
  };

  const recipientOptions = [
    "Toda la comunidad", "Todos los padres", "Todos los profesores",
    "Padres de 3 años", "Padres de 4 años", "Padres de 5 años",
    "Padres de 1° Primaria", "Padres de 2° Primaria", "Padres de 3° Primaria", "Padres de 4° Primaria", "Padres de 5° Primaria", "Padres de 6° Primaria",
    "Padres de 1° Secundaria", "Padres de 2° Secundaria", "Padres de 3° Secundaria", "Padres de 4° Secundaria", "Padres de 5° Secundaria",
    "Prof. Carlos Mendoza Ruiz", "Prof. Ana Sofía Reyes Torres", "Prof. Roberto García Mendez", "Prof. María Fernanda López",
    "Prof. Patricia Campos Rojas", "Prof. José Luis Paredes Silva", "Prof. Fernando Díaz Castro", "Prof. Gabriela Núñez Vega",
    "Dirección Académica", "Secretaría Académica",
  ];

  const handleMessageSelect = (message: MessageLocal) => {
    setSelectedMessage(message);
    setShowMobileMessage(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowMobileMenu(true)} className="lg:hidden p-2 hover:bg-white rounded-lg transition-colors"><Menu className="w-5 h-5 text-[#64748b]" /></button>
          <div>
            <h1 className="text-xl md:text-2xl text-[#1e293b]">Mensajería</h1>
            <p className="text-sm text-[#64748b] hidden sm:block">Comunicación centralizada del colegio</p>
          </div>
        </div>
        <button onClick={() => setShowNewMessage(true)} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors">
          <Plus className="w-4 h-4" /><span className="hidden sm:inline text-sm">Nuevo mensaje</span><span className="sm:hidden text-sm">Nuevo</span>
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-border shadow-sm overflow-hidden flex">
        {/* Left Nav Desktop */}
        <div className="hidden lg:flex w-64 border-r border-border flex-col">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input type="text" placeholder="Buscar mensajes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-[#f8fafc] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {navItems.map((item) => { const Icon = item.icon; const isActive = selectedCategory === item.value; return (
              <button key={item.value} onClick={() => setSelectedCategory(item.value)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]"}`}>
                <div className="flex items-center gap-3"><Icon className="w-5 h-5" /><span className="text-sm">{item.label}</span></div>
                {item.badge > 0 && <span className="px-2 py-0.5 bg-[#2563eb] text-white text-xs rounded-full">{item.badge}</span>}
              </button>
            ); })}
          </nav>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden">
            <div className="w-64 h-full bg-white">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg text-[#1e293b]">Menú</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-1 hover:bg-[#f8fafc] rounded-lg"><X className="w-5 h-5 text-[#64748b]" /></button>
              </div>
              <nav className="p-2">
                {navItems.map((item) => { const Icon = item.icon; const isActive = selectedCategory === item.value; return (
                  <button key={item.value} onClick={() => { setSelectedCategory(item.value); setShowMobileMenu(false); }} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-colors ${isActive ? "bg-[#eff6ff] text-[#2563eb]" : "text-[#64748b] hover:bg-[#f8fafc]"}`}>
                    <div className="flex items-center gap-3"><Icon className="w-5 h-5" /><span className="text-sm">{item.label}</span></div>
                    {item.badge > 0 && <span className="px-2 py-0.5 bg-[#2563eb] text-white text-xs rounded-full">{item.badge}</span>}
                  </button>
                ); })}
              </nav>
            </div>
          </div>
        )}

        {/* Middle - Message List */}
        <div className={`${showMobileMessage ? "hidden" : "flex"} md:flex w-full md:w-80 lg:w-96 border-r border-border flex-col`}>
          <div className="p-4 border-b border-border">
            <h2 className="text-sm font-medium text-[#1e293b]">{navItems.find((item) => item.value === selectedCategory)?.label}</h2>
            <p className="text-xs text-[#64748b] mt-1">{filteredMessages.length} mensaje{filteredMessages.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center"><p className="text-sm text-[#64748b]">No hay mensajes</p></div>
            ) : (
              filteredMessages.map((message) => (
                <button key={message.id} onClick={() => handleMessageSelect(message)} className={`w-full p-4 border-b border-border text-left hover:bg-[#f8fafc] transition-colors ${selectedMessage?.id === message.id ? "bg-[#f8fafc]" : ""} ${message.unread ? "bg-[#eff6ff]/30" : ""}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${message.category === "announcements" ? "bg-[#fef3c7] text-[#f59e0b]" : "bg-[#eff6ff] text-[#2563eb]"}`}>
                      <span className="text-sm">{message.avatar}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm ${message.unread ? "font-semibold text-[#1e293b]" : "text-[#1e293b]"} truncate`}>{message.sender}</h3>
                        <span className="text-xs text-[#64748b] ml-2 shrink-0">{message.time}</span>
                      </div>
                      <p className={`text-sm ${message.unread ? "font-medium text-[#1e293b]" : "text-[#64748b]"} truncate mb-1`}>{message.subject}</p>
                      <p className="text-xs text-[#64748b] truncate">{message.preview}</p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2"><Paperclip className="w-3 h-3 text-[#64748b]" /><span className="text-xs text-[#64748b]">{message.attachments.length} adjunto{message.attachments.length > 1 ? "s" : ""}</span></div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right - Message Detail */}
        <div className={`${showMobileMessage ? "flex" : "hidden md:flex"} flex-1 flex-col bg-[#f8fafc]`}>
          {selectedMessage ? (
            <>
              <div className="bg-white border-b border-border p-4 md:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <button onClick={() => setShowMobileMessage(false)} className="md:hidden p-1 hover:bg-[#f8fafc] rounded-lg"><ChevronLeft className="w-5 h-5 text-[#64748b]" /></button>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${selectedMessage.category === "announcements" ? "bg-[#fef3c7] text-[#f59e0b]" : "bg-[#eff6ff] text-[#2563eb]"}`}>
                    <span className="text-sm">{selectedMessage.avatar}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg text-[#1e293b] mb-1">{selectedMessage.subject}</h2>
                    <p className="text-sm text-[#64748b]">{selectedMessage.sender}</p>
                    <p className="text-xs text-[#64748b]">{selectedMessage.senderRole}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-[#64748b]">
                  <span>Para: {selectedMessage.recipients.join(", ")}</span>
                  <span>{selectedMessage.date} • {selectedMessage.time}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="bg-white rounded-lg p-6 border border-border">
                  <div className="prose prose-sm max-w-none">
                    {selectedMessage.content.split("\n").map((line, index) => (
                      <p key={index} className="text-sm text-[#1e293b] mb-3">{line}</p>
                    ))}
                  </div>
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-border">
                      <h3 className="text-sm text-[#64748b] mb-3">Archivos adjuntos ({selectedMessage.attachments.length})</h3>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-[#f8fafc] hover:bg-white transition-colors">
                            <div className="p-2 bg-[#dc2626]/10 rounded"><File className="w-5 h-5 text-[#dc2626]" /></div>
                            <div className="flex-1 min-w-0"><p className="text-sm text-[#1e293b] truncate">{attachment.name}</p><p className="text-xs text-[#64748b]">{attachment.size}</p></div>
                            <button onClick={handleDownload} className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Descargar</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-white border-t border-border p-4 flex flex-wrap gap-3">
                <button onClick={handleReply} className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"><Reply className="w-4 h-4" /> Responder</button>
                <button onClick={handleForward} className="flex items-center gap-2 px-4 py-2 border border-border bg-white text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors text-sm"><Forward className="w-4 h-4" /> Reenviar</button>
                <button onClick={handleArchive} className="flex items-center gap-2 px-4 py-2 border border-border bg-white text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors text-sm"><Archive className="w-4 h-4" /> Archivar</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center"><Inbox className="w-16 h-16 text-[#cbd5e1] mx-auto mb-4" /><p className="text-sm text-[#64748b]">Selecciona un mensaje para leerlo</p></div>
            </div>
          )}
        </div>
      </div>

      {showNewMessage && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-border p-4 flex items-center justify-between">
              <h2 className="text-lg text-[#1e293b]">Nuevo Mensaje</h2>
              <button onClick={() => setShowNewMessage(false)} className="p-1 hover:bg-[#f8fafc] rounded-lg transition-colors"><X className="w-5 h-5 text-[#64748b]" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#64748b] mb-2">Destinatarios</label>
                <select value={newMsgRecipient} onChange={(e) => setNewMsgRecipient(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm">
                  <option value="">Seleccionar destinatarios...</option>
                  <optgroup label="Grupos generales">
                    <option value="Toda la comunidad">Toda la comunidad educativa</option>
                    <option value="Todos los padres">Todos los padres de familia</option>
                    <option value="Todos los profesores">Todos los profesores</option>
                  </optgroup>
                  <optgroup label="Padres por grado - Inicial">
                    <option value="Padres de 3 años">Padres de 3 años</option>
                    <option value="Padres de 4 años">Padres de 4 años</option>
                    <option value="Padres de 5 años">Padres de 5 años</option>
                  </optgroup>
                  <optgroup label="Padres por grado - Primaria">
                    <option value="Padres de 1° Primaria">Padres de 1° Primaria</option>
                    <option value="Padres de 2° Primaria">Padres de 2° Primaria</option>
                    <option value="Padres de 3° Primaria">Padres de 3° Primaria</option>
                    <option value="Padres de 4° Primaria">Padres de 4° Primaria</option>
                    <option value="Padres de 5° Primaria">Padres de 5° Primaria</option>
                    <option value="Padres de 6° Primaria">Padres de 6° Primaria</option>
                  </optgroup>
                  <optgroup label="Padres por grado - Secundaria">
                    <option value="Padres de 1° Secundaria">Padres de 1° Secundaria</option>
                    <option value="Padres de 2° Secundaria">Padres de 2° Secundaria</option>
                    <option value="Padres de 3° Secundaria">Padres de 3° Secundaria</option>
                    <option value="Padres de 4° Secundaria">Padres de 4° Secundaria</option>
                    <option value="Padres de 5° Secundaria">Padres de 5° Secundaria</option>
                  </optgroup>
                  <optgroup label="Profesores">
                    <option value="Prof. Carlos Mendoza Ruiz">Prof. Carlos Mendoza Ruiz</option>
                    <option value="Prof. Ana Sofía Reyes Torres">Prof. Ana Sofía Reyes Torres</option>
                    <option value="Prof. Roberto García Mendez">Prof. Roberto García Mendez</option>
                    <option value="Prof. María Fernanda López">Prof. María Fernanda López</option>
                    <option value="Prof. Patricia Campos Rojas">Prof. Patricia Campos Rojas</option>
                    <option value="Prof. José Luis Paredes Silva">Prof. José Luis Paredes Silva</option>
                    <option value="Prof. Fernando Díaz Castro">Prof. Fernando Díaz Castro</option>
                    <option value="Prof. Gabriela Núñez Vega">Prof. Gabriela Núñez Vega</option>
                  </optgroup>
                  <optgroup label="Administración">
                    <option value="Dirección Académica">Dirección Académica</option>
                    <option value="Secretaría Académica">Secretaría Académica</option>
                  </optgroup>
                  {newMsgRecipient && !recipientOptions.includes(newMsgRecipient) && (
                    <option value={newMsgRecipient}>{newMsgRecipient}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-2">Asunto</label>
                <input type="text" value={newMsgSubject} onChange={(e) => setNewMsgSubject(e.target.value)} placeholder="Escribe el asunto..." className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
              </div>
              <div>
                <label className="block text-sm text-[#64748b] mb-2">Mensaje</label>
                <textarea rows={8} value={newMsgBody} onChange={(e) => setNewMsgBody(e.target.value)} placeholder="Escribe tu mensaje aquí..." className="w-full px-3 py-2 rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm resize-none" />
              </div>
              {newMsgAttachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-[#64748b]">Archivos adjuntos ({newMsgAttachments.length})</p>
                  {newMsgAttachments.map((att, i) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-[#f8fafc]">
                      <File className="w-4 h-4 text-[#64748b]" />
                      <span className="text-sm text-[#1e293b] flex-1 truncate">{att.name}</span>
                      <span className="text-xs text-[#64748b]">{att.size}</span>
                      <button onClick={() => setNewMsgAttachments((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 hover:bg-white rounded transition-colors"><X className="w-3 h-3 text-[#64748b]" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} multiple />
                <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} multiple />
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors text-sm"><Paperclip className="w-4 h-4 text-[#64748b]" /> Adjuntar archivo</button>
                <button onClick={() => imageInputRef.current?.click()} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white hover:bg-[#f8fafc] transition-colors text-sm"><ImageIcon className="w-4 h-4 text-[#64748b]" /> Adjuntar imagen</button>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={handleSendMessage} className="flex-1 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm">Enviar mensaje</button>
                <button onClick={() => { setShowNewMessage(false); setNewMsgRecipient(""); setNewMsgSubject(""); setNewMsgBody(""); setNewMsgAttachments([]); }} className="px-4 py-2 border border-border bg-white text-[#64748b] rounded-lg hover:bg-[#f8fafc] transition-colors text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
      <UnsavedChangesGuard isDirty={isDirty} />
    </div>
  );
}
