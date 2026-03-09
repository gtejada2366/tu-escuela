import { useState } from "react";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { useToast } from "../components/Toast";
import { Settings, GraduationCap } from "lucide-react";

export function Configuracion() {
  const { schoolName, tagline, logoUrl, updateConfig } = useSchoolConfig();
  const { showToast } = useToast();

  const [formName, setFormName] = useState(schoolName);
  const [formTagline, setFormTagline] = useState(tagline);
  const [formLogoUrl, setFormLogoUrl] = useState(logoUrl);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("El nombre del colegio es obligatorio", "error");
      return;
    }
    updateConfig({
      schoolName: formName.trim(),
      tagline: formTagline.trim(),
      logoUrl: formLogoUrl.trim(),
    });
    showToast("Configuración guardada correctamente", "success");
  };

  const handleReset = () => {
    setFormName("Tu Escuela");
    setFormTagline("Sistema de Gestión Escolar");
    setFormLogoUrl("");
    updateConfig({
      schoolName: "Tu Escuela",
      tagline: "Sistema de Gestión Escolar",
      logoUrl: "",
    });
    showToast("Configuración restablecida", "info");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl text-[#1e293b] mb-2">Configuración</h1>
        <p className="text-sm text-[#64748b]">Personaliza la identidad de tu colegio en el sistema</p>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <h2 className="text-sm text-[#64748b] uppercase tracking-wider mb-4">Vista previa</h2>
        <div className="flex items-center gap-4 p-4 bg-[#f8fafc] rounded-lg">
          <div className="w-14 h-14 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0 overflow-hidden">
            {formLogoUrl.trim() ? (
              <img
                src={formLogoUrl.trim()}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <GraduationCap className="w-7 h-7 text-[#2563eb]" />
            )}
          </div>
          <div>
            <p className="text-xl text-[#2563eb] font-semibold">{formName.trim() || "Tu Escuela"}</p>
            <p className="text-sm text-[#64748b]">{formTagline.trim() || "Sistema de Gestión Escolar"}</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-[#eff6ff]">
            <Settings className="w-5 h-5 text-[#2563eb]" />
          </div>
          <div>
            <h2 className="text-lg text-[#1e293b]">Identidad del Colegio</h2>
            <p className="text-xs text-[#64748b]">Estos datos aparecen en el menú lateral, login, recibos y reportes</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Nombre del colegio</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Colegio San Martín"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1e293b] mb-1">Eslogan o descripción</label>
            <input
              type="text"
              value={formTagline}
              onChange={(e) => setFormTagline(e.target.value)}
              placeholder="Ej: Formando líderes del mañana"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-[#1e293b] mb-1">URL del logo (opcional)</label>
            <input
              type="url"
              value={formLogoUrl}
              onChange={(e) => setFormLogoUrl(e.target.value)}
              placeholder="https://ejemplo.com/logo.png"
              className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
            />
            <p className="text-xs text-[#94a3b8] mt-1">Si no se proporciona, se mostrará un icono predeterminado</p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              Restablecer valores
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
            >
              Guardar Configuración
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
