import { useState } from "react";
import { Link, useParams } from "react-router";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { SortableHeader, sortData, getNextSort, type SortDirection } from "../components/SortableHeader";
import { ArrowLeft, Edit, UserX, UserCheck, MessageCircle, BookOpen, Clock, Users, FileCheck } from "lucide-react";
import { useProfesorProfileData } from "../hooks/useProfesorProfileData";
import { LoadingSpinner } from "../components/LoadingSpinner";

export function ProfesorProfile() {
  const { id } = useParams();
  const { showToast } = useToast();
  const { professor, loading, updateProfessor, toggleStatus } = useProfesorProfileData(id);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  // Edit form states
  const [editName, setEditName] = useState(professor?.name ?? "");
  const [editSubject, setEditSubject] = useState(professor?.subject ?? "");
  const [editPhone, setEditPhone] = useState(professor?.info.phone ?? "");
  const [editEmail, setEditEmail] = useState(professor?.info.email ?? "");
  const [editAddress, setEditAddress] = useState(professor?.info.address ?? "");

  // Message form states
  const [messageSubject, setMessageSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");

  const handleSort = (key: string) => {
    const next = getNextSort(key, sortKey, sortDir);
    setSortKey(next.key);
    setSortDir(next.direction);
  };

  if (loading) return <LoadingSpinner />;

  const handleOpenEditModal = () => {
    if (!professor) return;
    setEditName(professor.name);
    setEditSubject(professor.subject);
    setEditPhone(professor.info.phone);
    setEditEmail(professor.info.email);
    setEditAddress(professor.info.address);
    setShowEditModal(true);
  };

  const handleSaveEdit = () => {
    updateProfessor({
      name: editName,
      subject: editSubject,
      info: { fullName: editName, phone: editPhone, email: editEmail, address: editAddress },
    });
    setShowEditModal(false);
    showToast("Profesor actualizado exitosamente", "success");
  };

  const handleOpenMessageModal = () => {
    setMessageSubject("");
    setMessageBody("");
    setShowMessageModal(true);
  };

  const handleSendMessage = () => {
    setShowMessageModal(false);
    showToast("Mensaje enviado exitosamente", "success");
  };

  const handleToggleStatus = () => {
    if (!professor) return;
    const willDeactivate = professor.status === "active";
    toggleStatus();
    setShowDeactivateModal(false);
    showToast(
      willDeactivate
        ? "Profesor desactivado exitosamente"
        : "Profesor activado exitosamente",
      "success"
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <Badge variant="success">Activo</Badge>;
      case "inactive": return <Badge variant="neutral">Inactivo</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (!professor) {
    return (
      <div className="space-y-6">
        <Link to="/profesores" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver a Profesores
        </Link>
        <div className="bg-white rounded-lg p-12 border border-border shadow-sm text-center">
          <p className="text-lg text-[#1e293b] mb-2">Profesor no encontrado</p>
          <p className="text-sm text-[#64748b]">El profesor que buscas no existe.</p>
        </div>
      </div>
    );
  }

  const isActive = professor.status === "active";

  const sortedClasses = sortData(professor.classes, sortKey, sortDir);

  return (
    <div className="space-y-6">
      <Link to="/profesores" className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver a Profesores
      </Link>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
            <span className="text-3xl text-[#2563eb]">{professor.avatar}</span>
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl text-[#1e293b] mb-2">{professor.name}</h1>
                <p className="text-sm text-[#64748b] mb-1">{professor.subject}</p>
                <p className="text-sm text-[#94a3b8] mb-3">{professor.grades}</p>
                {getStatusBadge(professor.status)}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleOpenEditModal}
                  className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
                >
                  <Edit className="w-4 h-4" /> Editar Profesor
                </button>
                <button
                  onClick={handleOpenMessageModal}
                  className="flex items-center gap-2 px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
                >
                  <MessageCircle className="w-4 h-4" /> Enviar Mensaje
                </button>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className={`flex items-center gap-2 px-4 py-2 border bg-white rounded-lg transition-colors text-sm ${
                    isActive
                      ? "border-[#dc2626] text-[#dc2626] hover:bg-[#fef2f2]"
                      : "border-[#10b981] text-[#10b981] hover:bg-[#f0fdf4]"
                  }`}
                >
                  {isActive ? (
                    <><UserX className="w-4 h-4" /> Desactivar</>
                  ) : (
                    <><UserCheck className="w-4 h-4" /> Activar</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-[#eff6ff]"><BookOpen className="w-6 h-6 text-[#2563eb]" /></div>
          </div>
          <h3 className="text-sm text-[#64748b] mb-1">Clases esta Semana</h3>
          <p className="text-2xl text-[#1e293b]">{professor.metrics.classesThisWeek}</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-[#eff6ff]"><Users className="w-6 h-6 text-[#2563eb]" /></div>
          </div>
          <h3 className="text-sm text-[#64748b] mb-1">Asistencia Promedio</h3>
          <p className="text-2xl text-[#1e293b]">{professor.metrics.averageAttendance}%</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-lg bg-[#eff6ff]"><FileCheck className="w-6 h-6 text-[#2563eb]" /></div>
          </div>
          <h3 className="text-sm text-[#64748b] mb-1">Evaluaciones Registradas</h3>
          <p className="text-2xl text-[#1e293b]">{professor.metrics.evaluationsRegistered}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Información Personal</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Nombre Completo</p><p className="text-sm text-[#1e293b]">{professor.info.fullName}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Materias</p><p className="text-sm text-[#1e293b]">{professor.subject || "Sin asignar"}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Grados Asignados</p><p className="text-sm text-[#1e293b]">{professor.grades || "Sin asignar"}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Teléfono</p><p className="text-sm text-[#1e293b]">{professor.info.phone || "—"}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Email</p><p className="text-sm text-[#1e293b]">{professor.info.email || "—"}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Dirección</p><p className="text-sm text-[#1e293b]">{professor.info.address || "—"}</p></div>
          <div><p className="text-xs text-[#64748b] uppercase tracking-wider mb-1">Fecha de Ingreso</p><p className="text-sm text-[#1e293b]">{professor.info.joinDate}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-[#1e293b]">Clases Asignadas</h2>
          <Link to={`/profesores/${id}/gestion`} className="text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors">Gestionar Clases →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#f8fafc] border-b border-border">
              <tr>
                <SortableHeader label="Curso" sortKey="course" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="px-4" />
                <SortableHeader label="Grado" sortKey="grade" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="px-4" />
                <SortableHeader label="Sección" sortKey="section" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="px-4" />
                <SortableHeader label="Horario" sortKey="schedule" currentSortKey={sortKey} currentDirection={sortDir} onSort={handleSort} className="px-4" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sortedClasses.map((classItem, index) => (
                <tr key={index} className="hover:bg-[#f8fafc] transition-colors">
                  <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{classItem.course}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{classItem.grade}</span></td>
                  <td className="px-4 py-3"><span className="text-sm text-[#1e293b]">{classItem.section}</span></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2 text-sm text-[#64748b]"><Clock className="w-4 h-4" />{classItem.schedule}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-border shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-4">Horario Semanal</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {professor.weeklySchedule.map((day, index) => (
            <div key={index} className="border border-border rounded-lg p-4">
              <h3 className="text-sm text-[#1e293b] mb-3">{day.day}</h3>
              <div className="space-y-2">
                {day.slots.map((slot, slotIndex) => (
                  <div key={slotIndex} className="bg-[#eff6ff] rounded p-2">
                    <p className="text-xs text-[#64748b] mb-1">{slot.time}</p>
                    <p className="text-xs text-[#2563eb]">{slot.class}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Professor Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Editar Profesor" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Nombre Completo</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Materia</label>
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Teléfono</label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm text-[#1e293b] mb-1">Dirección</label>
            <input
              type="text"
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowEditModal(false)}
            className="px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveEdit}
            className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
          >
            Guardar Cambios
          </button>
        </div>
      </Modal>

      {/* Send Message Modal */}
      <Modal isOpen={showMessageModal} onClose={() => setShowMessageModal(false)} title="Enviar Mensaje">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Para</label>
            <p className="text-sm text-[#64748b] px-3 py-2 bg-[#f8fafc] border border-border rounded-lg">{professor.name}</p>
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Asunto</label>
            <input
              type="text"
              value={messageSubject}
              onChange={(e) => setMessageSubject(e.target.value)}
              placeholder="Escribe el asunto del mensaje..."
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Mensaje</label>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Escribe tu mensaje aquí..."
              rows={6}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowMessageModal(false)}
            className="px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSendMessage}
            className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
          >
            Enviar
          </button>
        </div>
      </Modal>

      {/* Deactivate/Activate Confirmation Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={isActive ? "Desactivar Profesor" : "Activar Profesor"}
        size="sm"
      >
        <div className="text-center">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${isActive ? "bg-[#fef2f2]" : "bg-[#f0fdf4]"}`}>
            {isActive ? (
              <UserX className="w-6 h-6 text-[#dc2626]" />
            ) : (
              <UserCheck className="w-6 h-6 text-[#10b981]" />
            )}
          </div>
          <p className="text-sm text-[#64748b] mb-6">
            {isActive
              ? `¿Estás seguro de que deseas desactivar a este profesor? ${professor.name} no podrá acceder al sistema mientras esté inactivo.`
              : `¿Estás seguro de que deseas activar a ${professor.name}? Podrá acceder nuevamente al sistema.`}
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setShowDeactivateModal(false)}
            className="px-4 py-2 border border-border bg-white rounded-lg hover:bg-[#f8fafc] transition-colors text-sm text-[#1e293b]"
          >
            Cancelar
          </button>
          <button
            onClick={handleToggleStatus}
            className={`px-4 py-2 text-white rounded-lg transition-colors text-sm ${
              isActive
                ? "bg-[#dc2626] hover:bg-[#b91c1c]"
                : "bg-[#10b981] hover:bg-[#059669]"
            }`}
          >
            {isActive ? "Desactivar" : "Activar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
