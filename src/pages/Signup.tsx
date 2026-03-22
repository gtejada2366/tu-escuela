import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { isValidEmail, validatePassword } from "../lib/validation";
import { supabase } from "../lib/supabase";
import { GraduationCap, Eye, EyeOff, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";

interface SignupProps {
  onBack: () => void;
  onLogin: () => void;
}

export function Signup({ onBack, onLogin }: SignupProps) {
  const { login } = useAuth();

  const [form, setForm] = useState({
    schoolName: "",
    directorName: "",
    email: "",
    password: "",
    confirmPassword: "",
    plan: "basico" as "basico" | "pro",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.schoolName.trim()) return setError("Ingresa el nombre del colegio");
    if (!form.directorName.trim()) return setError("Ingresa tu nombre");
    if (!form.email.trim()) return setError("Ingresa tu correo electrónico");
    if (!isValidEmail(form.email)) return setError("El correo electrónico no es válido");

    const pwError = validatePassword(form.password);
    if (pwError) return setError(pwError);
    if (form.password !== form.confirmPassword) return setError("Las contraseñas no coinciden");

    setSubmitting(true);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        setError("Supabase no está configurado");
        setSubmitting(false);
        return;
      }

      const res = await fetch(`${supabaseUrl}/functions/v1/register-school`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({
          school_name: form.schoolName.trim(),
          director_name: form.directorName.trim(),
          email: form.email.trim(),
          password: form.password,
          plan: form.plan,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Error al registrar. Intenta de nuevo.");
        setSubmitting(false);
        return;
      }

      // Auto-login
      const loginErr = await login(form.email.trim(), form.password);
      if (loginErr) {
        setError("Cuenta creada. " + loginErr);
      }
    } catch {
      setError("Error de conexión. Verifica tu internet e intenta de nuevo.");
    }

    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#eff6ff] mb-4">
            <GraduationCap className="w-8 h-8 text-[#2563eb]" />
          </div>
          <h1 className="text-3xl text-[#1e293b] font-semibold mb-2">Crear tu Escuela</h1>
          <p className="text-sm text-[#64748b]">Registra tu colegio y empieza a gestionar en minutos</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School name */}
            <div>
              <label htmlFor="signup-school" className="block text-sm text-[#1e293b] mb-1">
                Nombre del Colegio
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  id="signup-school"
                  type="text"
                  value={form.schoolName}
                  onChange={(e) => set("schoolName", e.target.value)}
                  placeholder="Colegio San Martín"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>
            </div>

            {/* Director name */}
            <div>
              <label htmlFor="signup-name" className="block text-sm text-[#1e293b] mb-1">
                Tu Nombre (Director)
              </label>
              <input
                id="signup-name"
                type="text"
                value={form.directorName}
                onChange={(e) => set("directorName", e.target.value)}
                placeholder="María Elena Gutiérrez"
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="signup-email" className="block text-sm text-[#1e293b] mb-1">
                Correo Electrónico
              </label>
              <input
                id="signup-email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="director@tuescuela.edu.pe"
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="block text-sm text-[#1e293b] mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm pr-10"
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

            {/* Confirm password */}
            <div>
              <label htmlFor="signup-confirm" className="block text-sm text-[#1e293b] mb-1">
                Confirmar Contraseña
              </label>
              <input
                id="signup-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                placeholder="Repite tu contraseña"
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
              />
            </div>

            {/* Plan selection */}
            <div>
              <label className="block text-sm text-[#1e293b] mb-2">Plan</label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { value: "basico", label: "Básico", price: "S/ 299/mes", desc: "Hasta 300 alumnos" },
                  { value: "pro", label: "Pro", price: "S/ 599/mes", desc: "Alumnos ilimitados" },
                ] as const).map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => set("plan", p.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      form.plan === p.value
                        ? "border-[#2563eb] bg-[#eff6ff]"
                        : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-[#1e293b]">{p.label}</span>
                      {form.plan === p.value && <CheckCircle2 className="w-4 h-4 text-[#2563eb]" />}
                    </div>
                    <p className="text-xs text-[#2563eb] font-medium">{p.price}</p>
                    <p className="text-xs text-[#64748b]">{p.desc}</p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#64748b] mt-2">Prueba gratis por 14 días. Sin tarjeta de crédito.</p>
            </div>

            {error && (
              <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creando tu escuela..." : "Registrar mi Colegio"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-[#e2e8f0] text-center">
            <p className="text-sm text-[#64748b]">
              ¿Ya tienes cuenta?{" "}
              <button onClick={onLogin} className="text-[#2563eb] hover:text-[#1d4ed8] font-medium">
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>

        <button
          onClick={onBack}
          className="flex items-center justify-center gap-1 text-sm text-[#64748b] hover:text-[#2563eb] transition-colors mt-6 mx-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </button>
      </div>
    </div>
  );
}
