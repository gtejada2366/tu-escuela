import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { GraduationCap, Eye, EyeOff } from "lucide-react";

export function ResetPassword() {
  const { schoolName, logoUrl } = useSchoolConfig();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!supabase) {
      setSessionValid(false);
      return;
    }

    // Supabase appends #access_token=...&type=recovery to the redirect URL.
    // The JS client picks it up automatically, so we just verify the session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSessionValid(!!session);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Completa ambos campos");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (!supabase) {
      setError("Supabase no está configurado");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);

    // Redirect to login after a short delay
    const sb = supabase;
    setTimeout(() => {
      sb!.auth.signOut()
        .then(() => { window.location.href = "/"; })
        .catch(() => { window.location.href = "/"; });
    }, 3000);
  };

  // Loading state while checking session
  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#64748b]">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#eff6ff] mb-4 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <GraduationCap className="w-8 h-8 text-[#2563eb]" />
            )}
          </div>
          <h1 className="text-3xl text-[#1e293b] font-semibold mb-2">{schoolName}</h1>
          <p className="text-sm text-[#64748b]">Restablecer contraseña</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          {!supabase ? (
            <div className="text-center py-4">
              <p className="text-sm text-[#64748b]">
                La recuperación de contraseña requiere que Supabase esté configurado. Contacta al administrador del sistema.
              </p>
            </div>
          ) : success ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                <span className="text-lg">&#10003;</span>
              </div>
              <h2 className="text-lg text-[#1e293b] mb-2">Contraseña actualizada</h2>
              <p className="text-sm text-[#64748b]">
                Tu contraseña ha sido restablecida correctamente. Serás redirigido al inicio de sesión...
              </p>
            </div>
          ) : !sessionValid ? (
            <div className="text-center py-4">
              <h2 className="text-lg text-[#1e293b] mb-2">Enlace inválido o expirado</h2>
              <p className="text-sm text-[#64748b] mb-4">
                El enlace de recuperación ha expirado o no es válido. Solicita uno nuevo desde la pantalla de inicio de sesión.
              </p>
              <a
                href="/"
                className="inline-block px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
              >
                Ir al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <h2 className="text-lg text-[#1e293b] mb-1">Nueva contraseña</h2>
              <p className="text-sm text-[#64748b] mb-6">Ingresa tu nueva contraseña</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Nueva contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
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

                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Confirmar contraseña</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Guardando..." : "Restablecer contraseña"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-6">
          {schoolName} &mdash; Sistema de Gesti&oacute;n Escolar
        </p>
      </div>
    </div>
  );
}
