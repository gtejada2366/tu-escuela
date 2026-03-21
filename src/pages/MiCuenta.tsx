import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../components/Toast";
import { Eye, EyeOff, User, Lock, Mail, Shield } from "lucide-react";
import { isValidEmail, validatePassword } from "../lib/validation";
import { UnsavedChangesGuard } from "../components/UnsavedChangesGuard";

export function MiCuenta() {
  const { user, changePassword, updateCurrentUser } = useAuth();
  const { showToast } = useToast();

  const [formName, setFormName] = useState(user?.name ?? "");
  const [formEmail, setFormEmail] = useState(user?.email ?? "");
  const [editingProfile, setEditingProfile] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const isDirty = editingProfile && (formName !== (user?.name ?? "") || formEmail !== (user?.email ?? ""))
    || oldPassword.length > 0 || newPassword.length > 0 || confirmPassword.length > 0;

  const roleLabelMap: Record<string, string> = { director: "Director", profesor: "Profesor", padre: "Padre/Apoderado" };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Completa todos los campos", "error");
      return;
    }
    if (!isValidEmail(formEmail)) {
      showToast("Ingresa un correo electrónico válido", "error");
      return;
    }
    try {
      await updateCurrentUser({ name: formName.trim(), email: formEmail.trim() });
      showToast("Perfil actualizado correctamente", "success");
    } catch {
      showToast("Error al guardar. Intenta de nuevo.", "error");
      return;
    }
    setEditingProfile(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError("Completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas nuevas no coinciden");
      return;
    }

    const passErr = validatePassword(newPassword);
    if (passErr) {
      setPasswordError(passErr);
      return;
    }

    const err = await changePassword(oldPassword, newPassword);
    if (err) {
      setPasswordError(err);
      return;
    }

    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    showToast("Contraseña actualizada correctamente", "success");
  };

  const PasswordInput = ({
    id,
    value,
    onChange,
    show,
    onToggle,
    placeholder,
  }: {
    id?: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    onToggle: () => void;
    placeholder: string;
  }) => (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => { onChange(e.target.value); setPasswordError(""); }}
        placeholder={placeholder}
        className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Mi Cuenta</h1>
        <p className="text-sm text-[#64748b]">Administra tu información personal y contraseña</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#eff6ff]">
            <User className="w-5 h-5 text-[#2563eb]" />
          </div>
          <div>
            <h2 className="text-lg text-[#1e293b]">Información Personal</h2>
            <p className="text-xs text-[#64748b]">Tus datos de perfil en el sistema</p>
          </div>
        </div>

        {!editingProfile ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-lg">
              <div className="w-14 h-14 rounded-full bg-[#eff6ff] flex items-center justify-center shrink-0">
                <span className="text-lg text-[#2563eb]">{user?.avatar ?? "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base text-[#1e293b]">{user?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Mail className="w-3.5 h-3.5 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Shield className="w-3.5 h-3.5 text-[#64748b]" />
                  <span className="text-sm text-[#64748b]">{roleLabelMap[user?.role ?? "profesor"]}</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditingProfile(true)}
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Editar Perfil
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label htmlFor="account-name" className="block text-sm text-[#1e293b] mb-1">Nombre completo</label>
              <input
                id="account-name"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div>
              <label htmlFor="account-email" className="block text-sm text-[#1e293b] mb-1">Correo electrónico</label>
              <input
                id="account-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(false);
                  setFormName(user?.name ?? "");
                  setFormEmail(user?.email ?? "");
                }}
                className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Password Card */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#fef3c7]">
            <Lock className="w-5 h-5 text-[#d97706]" />
          </div>
          <div>
            <h2 className="text-lg text-[#1e293b]">Cambiar Contraseña</h2>
            <p className="text-xs text-[#64748b]">Actualiza tu contraseña de acceso al sistema</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="account-current-password" className="block text-sm text-[#1e293b] mb-1">Contraseña actual</label>
            <PasswordInput
              id="account-current-password"
              value={oldPassword}
              onChange={setOldPassword}
              show={showOld}
              onToggle={() => setShowOld((v) => !v)}
              placeholder="Ingresa tu contraseña actual"
            />
          </div>
          <div>
            <label htmlFor="account-new-password" className="block text-sm text-[#1e293b] mb-1">Nueva contraseña</label>
            <PasswordInput
              id="account-new-password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew((v) => !v)}
              placeholder="Mínimo 8 caracteres"
            />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className="block text-sm text-[#1e293b] mb-1">Confirmar nueva contraseña</label>
            <PasswordInput
              id="account-confirm-password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={() => setShowConfirm((v) => !v)}
              placeholder="Repite la nueva contraseña"
            />
          </div>

          {passwordError && (
            <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{passwordError}</p>
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#d97706] text-white text-sm hover:bg-[#b45309] transition-colors"
          >
            Cambiar Contraseña
          </button>
        </form>
      </div>
      <UnsavedChangesGuard isDirty={isDirty} />
    </div>
  );
}
