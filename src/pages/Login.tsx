import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { GraduationCap, Eye, EyeOff, ArrowLeft } from "lucide-react";

interface LoginProps {
  onBack?: () => void;
  onSignup?: () => void;
}

export function Login({ onBack, onSignup }: LoginProps) {
  const { login, resetPassword } = useAuth();
  const { schoolName, tagline, logoUrl } = useSchoolConfig();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetting, setResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Ingresa tu correo y contraseña");
      return;
    }

    setSubmitting(true);
    const err = await login(email.trim(), password);
    if (err) setError(err);
    setSubmitting(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");

    if (!resetEmail.trim()) {
      setResetError("Ingresa tu correo electrónico");
      return;
    }

    setResetting(true);
    const err = await resetPassword(resetEmail.trim());
    if (err) {
      setResetError(err);
    } else {
      setResetSent(true);
    }
    setResetting(false);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#eff6ff] mb-4 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo del colegio" className="w-full h-full object-cover" />
            ) : (
              <GraduationCap className="w-8 h-8 text-[#2563eb]" />
            )}
          </div>
          <h1 className="text-3xl text-[#1e293b] font-semibold mb-2">{schoolName}</h1>
          <p className="text-sm text-[#64748b]">{tagline}</p>
        </div>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          {showReset ? (
            <>
              <button
                onClick={() => { setShowReset(false); setResetSent(false); setResetError(""); }}
                className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
              </button>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                    <span className="text-lg">✓</span>
                  </div>
                  <h2 className="text-lg text-[#1e293b] mb-2">Correo enviado</h2>
                  <p className="text-sm text-[#64748b]">
                    Revisa tu bandeja de entrada en <span className="text-[#1e293b]">{resetEmail}</span>. Te enviamos un enlace para restablecer tu contraseña.
                  </p>
                </div>
              ) : (
                <>
                  <h2 className="text-lg text-[#1e293b] mb-1">Recuperar contraseña</h2>
                  <p className="text-sm text-[#64748b] mb-6">Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña</p>

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label htmlFor="login-reset-email" className="block text-sm text-[#1e293b] mb-1">Correo electrónico</label>
                      <input
                        id="login-reset-email"
                        type="email"
                        value={resetEmail}
                        onChange={(e) => { setResetEmail(e.target.value); setResetError(""); }}
                        placeholder="tu@correo.edu.pe"
                        className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                      />
                    </div>

                    {resetError && (
                      <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{resetError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={resetting}
                      className="w-full px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {resetting ? "Enviando..." : "Enviar enlace de recuperación"}
                    </button>
                  </form>
                </>
              )}
            </>
          ) : (
            <>
              <h2 className="text-lg text-[#1e293b] mb-1">Iniciar Sesión</h2>
              <p className="text-sm text-[#64748b] mb-6">Ingresa tus credenciales para acceder</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-sm text-[#1e293b] mb-1">Correo electrónico</label>
                  <input
                    id="login-email"
                    type="text"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    placeholder="director@tuescuela.edu.pe"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="login-password" className="block text-sm text-[#1e293b]">Contraseña</label>
                    <button
                      type="button"
                      onClick={() => { setShowReset(true); setResetEmail(email); }}
                      className="text-xs text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  {submitting ? "Ingresando..." : "Ingresar"}
                </button>
              </form>
            </>
          )}
        </div>

        {onSignup && (
          <div className="mt-4 text-center">
            <p className="text-sm text-[#64748b]">
              ¿No tienes cuenta?{" "}
              <button onClick={onSignup} className="text-[#2563eb] hover:text-[#1d4ed8] font-medium">
                Regístrate gratis
              </button>
            </p>
          </div>
        )}

        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-1 text-sm text-[#64748b] hover:text-[#2563eb] transition-colors mt-6 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Volver al inicio
          </button>
        )}

        <p className="text-center text-xs text-[#94a3b8] mt-4">
          {schoolName} &mdash; {tagline}
        </p>
      </div>
    </div>
  );
}
