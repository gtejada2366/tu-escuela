import { useState } from "react";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { useAuth } from "../contexts/AuthContext";
import { Shield, BookOpen, Edit, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { isValidEmail, validatePassword } from "../lib/validation";

export function Roles() {
  const { showToast } = useToast();
  const { usersRegistry, addUser, updateUser, removeUser } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<"director" | "profesor">("profesor");
  const [formStatus, setFormStatus] = useState<"active" | "inactive">("active");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const directors = usersRegistry.filter((u) => u.role === "director");
  const profesores = usersRegistry.filter((u) => u.role === "profesor");
  const deletingUser = usersRegistry.find((u) => u.id === deletingUserId) ?? null;

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setFormName("");
    setFormEmail("");
    setFormRole("profesor");
    setFormStatus("active");
    setFormPassword("");
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleOpenDelete = (id: number) => {
    setDeletingUserId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingUserId === null) return;
    try {
      await removeUser(deletingUserId);
      showToast("Usuario eliminado correctamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setShowDeleteModal(false);
    setDeletingUserId(null);
  };

  const handleOpenEdit = (id: number) => {
    const user = usersRegistry.find((u) => u.id === id);
    if (!user) return;
    setEditingUserId(id);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormStatus(user.status);
    setFormPassword("");
    setShowPassword(false);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Completa todos los campos obligatorios", "error");
      return;
    }

    if (!isValidEmail(formEmail)) {
      showToast("Ingresa un correo electrónico válido", "error");
      return;
    }

    if (editingUserId !== null) {
      const data: Partial<{ name: string; email: string; role: "director" | "profesor"; status: "active" | "inactive"; password: string }> = {
        name: formName.trim(),
        email: formEmail.trim(),
        role: formRole,
        status: formStatus,
      };
      if (formPassword.trim()) {
        data.password = formPassword.trim();
      }
      try {
        await updateUser(editingUserId, data);
        showToast("Usuario actualizado correctamente", "success");
      } catch {
        showToast("Error al guardar. Intenta de nuevo.", "error");
        return;
      }
    } else {
      if (!formPassword.trim()) {
        showToast("Debes asignar una contraseña al nuevo usuario", "error");
        return;
      }
      const passErr = validatePassword(formPassword.trim());
      if (passErr) {
        showToast(passErr, "error");
        return;
      }
      try {
        await addUser({
          name: formName.trim(),
          email: formEmail.trim(),
          role: formRole,
          status: formStatus,
          password: formPassword.trim(),
        });
        showToast("Usuario creado correctamente", "success");
      } catch {
        showToast("Error al guardar. Intenta de nuevo.", "error");
        return;
      }
    }
    setModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") return <Badge variant="success">Activo</Badge>;
    return <Badge variant="neutral">Inactivo</Badge>;
  };

  const UserCard = ({ user }: { user: typeof usersRegistry[0] }) => (
    <div className="flex items-center justify-between p-4 border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
          <span className="text-sm text-[#2563eb]">{user.avatar}</span>
        </div>
        <div>
          <p className="text-sm text-[#1e293b]">{user.name}</p>
          <p className="text-xs text-[#64748b]">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {getStatusBadge(user.status)}
        <button
          onClick={() => handleOpenEdit(user.id)}
          className="p-1.5 rounded-lg hover:bg-[#f1f5f9] transition-colors"
        >
          <Edit className="w-4 h-4 text-[#64748b]" />
        </button>
        <button
          onClick={() => handleOpenDelete(user.id)}
          className="p-1.5 rounded-lg hover:bg-[#fee2e2] transition-colors"
        >
          <Trash2 className="w-4 h-4 text-[#dc2626]" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl text-[#1e293b] mb-2">Gestión de Roles</h1>
          <p className="text-sm text-[#64748b]">Administra los usuarios y sus permisos en el sistema</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors"
        >
          <Plus className="w-4 h-4" /> Agregar Usuario
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#eff6ff]"><Shield className="w-5 h-5 text-[#2563eb]" /></div>
            <span className="text-sm text-[#64748b]">Directores</span>
          </div>
          <p className="text-3xl text-[#1e293b]">{directors.length}</p>
          <p className="text-xs text-[#64748b] mt-1">Acceso completo al sistema</p>
        </div>
        <div className="bg-white rounded-lg p-6 border border-[#e2e8f0] shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#ecfdf5]"><BookOpen className="w-5 h-5 text-[#10b981]" /></div>
            <span className="text-sm text-[#64748b]">Profesores</span>
          </div>
          <p className="text-3xl text-[#1e293b]">{profesores.length}</p>
          <p className="text-xs text-[#64748b] mt-1">Gestión de clases y calificaciones</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-1">Directores</h2>
        <p className="text-xs text-[#64748b] mb-4">Acceso a todos los módulos: estudiantes, profesores, clases, pagos, asistencia, calificaciones, mensajería y roles.</p>
        <div className="space-y-3">
          {directors.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <h2 className="text-lg text-[#1e293b] mb-1">Profesores</h2>
        <p className="text-xs text-[#64748b] mb-4">Acceso limitado: dashboard, mis clases, asistencia, calificaciones y mensajería.</p>
        <div className="space-y-3">
          {profesores.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUserId !== null ? "Editar Usuario" : "Agregar Usuario"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Carlos Mendoza Ruiz"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              placeholder="Ej: cmendoza@tuescuela.edu.pe"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">
              {editingUserId !== null ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña inicial"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                placeholder={editingUserId !== null ? "Sin cambios" : "Contraseña para el usuario"}
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Rol</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value as "director" | "profesor")}
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="director">Director</option>
              <option value="profesor">Profesor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Estado</label>
            <select
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "active" | "inactive")}
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            >
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              {editingUserId !== null ? "Guardar Cambios" : "Agregar Usuario"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setDeletingUserId(null); }}
        title="Eliminar Usuario"
        size="sm"
      >
        <div className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#fee2e2] flex items-center justify-center mb-4">
            <Trash2 className="w-5 h-5 text-[#dc2626]" />
          </div>
          <p className="text-sm text-[#64748b] mb-6">
            ¿Estás seguro de que deseas eliminar a <span className="text-[#1e293b] font-medium">{deletingUser?.name}</span>? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setShowDeleteModal(false); setDeletingUserId(null); }}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 rounded-lg bg-[#dc2626] text-white text-sm hover:bg-[#b91c1c] transition-colors"
            >
              Eliminar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
