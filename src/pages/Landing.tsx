import { useState } from "react";
import {
  GraduationCap,
  Users,
  ClipboardCheck,
  CreditCard,
  FileText,
  BarChart3,
  Shield,
  Heart,
  Upload,
  Bell,
  CheckCircle2,
  ChevronRight,
  Star,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";

interface LandingProps {
  onLogin: () => void;
}

const features = [
  {
    icon: Users,
    title: "Gestión de Estudiantes",
    description: "Registro completo, perfiles detallados, importación masiva por CSV. Toda la información de tus alumnos en un solo lugar.",
    color: "bg-[#eff6ff] text-[#2563eb]",
  },
  {
    icon: ClipboardCheck,
    title: "Control de Asistencia",
    description: "Registro diario por clase con reportes PDF automáticos. Detecta patrones de inasistencia al instante.",
    color: "bg-[#ecfdf5] text-[#10b981]",
  },
  {
    icon: BarChart3,
    title: "Calificaciones Flexibles",
    description: "Columnas configurables con pesos personalizados. Exporta libretas individuales y reportes por clase en PDF.",
    color: "bg-[#fef3c7] text-[#f59e0b]",
  },
  {
    icon: CreditCard,
    title: "Control de Pagos",
    description: "Seguimiento de pensiones, recibos PDF, tasa de cobranza en tiempo real. Nunca pierdas de vista un pago.",
    color: "bg-[#fee2e2] text-[#dc2626]",
  },
  {
    icon: FileText,
    title: "Reportes PDF",
    description: "Constancias de matrícula, libretas de notas, reportes de asistencia y recibos de pago. Todo con un clic.",
    color: "bg-[#f3e8ff] text-[#7c3aed]",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description: "Alertas de pagos vencidos, baja asistencia y nuevas calificaciones. Mantente al día sin esfuerzo.",
    color: "bg-[#fff7ed] text-[#ea580c]",
  },
];

const roles = [
  {
    icon: Shield,
    role: "Director",
    color: "from-[#2563eb] to-[#1d4ed8]",
    items: [
      "Dashboard con métricas en tiempo real",
      "Gestión completa de estudiantes y profesores",
      "Control financiero y tasa de cobranza",
      "Reportes PDF y exportaciones CSV",
      "Administración de roles y usuarios",
      "Configuración del colegio",
    ],
  },
  {
    icon: GraduationCap,
    role: "Profesor",
    color: "from-[#10b981] to-[#059669]",
    items: [
      "Dashboard personalizado por clase",
      "Registro de asistencia diaria",
      "Gestión de calificaciones con pesos",
      "Comunicación con la dirección",
      "Vista de sus clases y alumnos",
      "Gestión académica integrada",
    ],
  },
  {
    icon: Heart,
    role: "Padre / Apoderado",
    color: "from-[#f59e0b] to-[#d97706]",
    items: [
      "Vista de notas y promedio de sus hijos",
      "Historial de asistencia con gráficos",
      "Estado de pagos y pendientes",
      "Descarga de constancias y libretas PDF",
      "Acceso seguro de solo lectura",
      "Todo desde cualquier dispositivo",
    ],
  },
];

const testimonials = [
  {
    name: "María Elena Gutiérrez",
    role: "Directora, Colegio San Martín",
    text: "Antes pasábamos horas en Excel controlando pagos y asistencia. Con Tu Escuela, todo está en un solo lugar y los padres pueden ver las notas de sus hijos sin llamar al colegio.",
    stars: 5,
  },
  {
    name: "Carlos Mendoza",
    role: "Profesor de Matemáticas",
    text: "Registrar notas y asistencia me tomaba la mitad del recreo. Ahora lo hago en 2 minutos desde mi celular. Las libretas PDF se generan solas.",
    stars: 5,
  },
  {
    name: "Ana Rodríguez",
    role: "Madre de familia",
    text: "Ya no tengo que esperar a la reunión de padres para saber cómo va mi hijo. Entro a la app y veo todo: notas, asistencia, si estamos al día en pagos.",
    stars: 5,
  },
];

const pricing = [
  {
    name: "Gratuito",
    price: "S/ 0",
    period: "para siempre",
    description: "Para colegios pequeños que quieren empezar",
    features: [
      "Hasta 50 estudiantes",
      "1 sede",
      "Gestión básica de estudiantes",
      "Control de asistencia",
      "Calificaciones",
      "Reportes PDF",
    ],
    cta: "Empezar Gratis",
    highlighted: false,
  },
  {
    name: "Básico",
    price: "S/ 299",
    period: "/mes",
    description: "Para colegios en crecimiento",
    features: [
      "Hasta 300 estudiantes",
      "Portal de padres incluido",
      "Importación CSV masiva",
      "Reportes PDF ilimitados",
      "Control de pagos completo",
      "Notificaciones en app",
      "Soporte por email",
    ],
    cta: "Comenzar Prueba",
    highlighted: true,
  },
  {
    name: "Pro",
    price: "S/ 599",
    period: "/mes",
    description: "Para colegios consolidados",
    features: [
      "Estudiantes ilimitados",
      "Múltiples sedes",
      "Todo del plan Básico",
      "Notificaciones por email",
      "Integración de pagos online",
      "Soporte prioritario",
      "Personalización de marca",
    ],
    cta: "Contactar Ventas",
    highlighted: false,
  },
];

const stats = [
  { value: "500+", label: "Estudiantes gestionados" },
  { value: "98%", label: "Tasa de asistencia promedio" },
  { value: "6", label: "Tipos de reportes PDF" },
  { value: "3", label: "Roles de usuario" },
];

export function Landing({ onLogin }: LandingProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Navbar ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-[#e2e8f0] z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl text-[#1e293b] font-semibold">Tu Escuela</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("features")} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Funcionalidades</button>
              <button onClick={() => scrollTo("roles")} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Roles</button>
              <button onClick={() => scrollTo("pricing")} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Planes</button>
              <button onClick={() => scrollTo("testimonials")} className="text-sm text-[#64748b] hover:text-[#1e293b] transition-colors">Testimonios</button>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm text-[#2563eb] hover:bg-[#eff6ff] rounded-lg transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-lg transition-colors"
              >
                Prueba Gratis
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-[#f8fafc]"
              aria-label="Menú"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-[#e2e8f0] px-4 py-4 space-y-2">
            <button onClick={() => scrollTo("features")} className="block w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] rounded-lg">Funcionalidades</button>
            <button onClick={() => scrollTo("roles")} className="block w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] rounded-lg">Roles</button>
            <button onClick={() => scrollTo("pricing")} className="block w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] rounded-lg">Planes</button>
            <button onClick={() => scrollTo("testimonials")} className="block w-full text-left px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc] rounded-lg">Testimonios</button>
            <hr className="border-[#e2e8f0]" />
            <button onClick={onLogin} className="block w-full text-center px-4 py-2.5 text-sm text-white bg-[#2563eb] rounded-lg">Iniciar Sesión</button>
          </div>
        )}
      </nav>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-b from-[#eff6ff] to-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dbeafe] text-[#2563eb] text-sm mb-8">
            <Star className="w-4 h-4 fill-current" />
            <span>Plataforma #1 de gestión escolar en Perú</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl text-[#1e293b] font-bold leading-tight mb-6">
            Tu colegio, <br className="hidden sm:block" />
            <span className="text-[#2563eb]">organizado y conectado</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#64748b] max-w-2xl mx-auto mb-10">
            Gestiona estudiantes, profesores, notas, asistencia y pagos en un solo lugar.
            Los padres ven todo en tiempo real. Sin Excel. Sin llamadas.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={onLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-[#2563eb] text-white rounded-xl hover:bg-[#1d4ed8] transition-colors text-base font-medium shadow-lg shadow-[#2563eb]/25"
            >
              Comenzar Gratis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => scrollTo("features")}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-[#e2e8f0] bg-white text-[#1e293b] rounded-xl hover:bg-[#f8fafc] transition-colors text-base"
            >
              Ver Funcionalidades
            </button>
          </div>

          {/* Dashboard preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] overflow-hidden">
              <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#fecaca]"></div>
                <div className="w-3 h-3 rounded-full bg-[#fef3c7]"></div>
                <div className="w-3 h-3 rounded-full bg-[#d1fae5]"></div>
                <span className="ml-2 text-xs text-[#94a3b8]">tu-escuela.vercel.app</span>
              </div>
              <div className="p-6 sm:p-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Estudiantes", value: "247", icon: Users, color: "text-[#2563eb] bg-[#eff6ff]" },
                    { label: "Asistencia", value: "96.8%", icon: ClipboardCheck, color: "text-[#10b981] bg-[#ecfdf5]" },
                    { label: "Pagos al día", value: "89.2%", icon: CreditCard, color: "text-[#f59e0b] bg-[#fef3c7]" },
                    { label: "Profesores", value: "18", icon: GraduationCap, color: "text-[#7c3aed] bg-[#f3e8ff]" },
                  ].map((card) => (
                    <div key={card.label} className="bg-white rounded-xl border border-[#e2e8f0] p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`p-1.5 rounded-lg ${card.color}`}>
                          <card.icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs text-[#64748b]">{card.label}</span>
                      </div>
                      <p className="text-2xl text-[#1e293b] font-semibold">{card.value}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 sm:h-28 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex items-center justify-center">
                      <div className="w-3/4 space-y-2">
                        <div className="h-2 bg-[#e2e8f0] rounded-full"></div>
                        <div className="h-2 bg-[#e2e8f0] rounded-full w-2/3"></div>
                        <div className="h-2 bg-[#eff6ff] rounded-full w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-[#2563eb]/10 blur-2xl rounded-full"></div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────── */}
      <section className="py-16 px-4 bg-[#1e293b]">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl sm:text-4xl text-white font-bold">{stat.value}</p>
              <p className="text-sm text-[#94a3b8] mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-[#2563eb] font-medium mb-2">FUNCIONALIDADES</p>
            <h2 className="text-3xl sm:text-4xl text-[#1e293b] font-bold mb-4">Todo lo que necesita tu colegio</h2>
            <p className="text-[#64748b] max-w-xl mx-auto">Reemplaza Excel, WhatsApp y cuadernos con una sola plataforma integrada.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-[#e2e8f0] hover:shadow-lg hover:border-[#2563eb]/20 transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg text-[#1e293b] font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-white rounded-2xl border border-[#e2e8f0] p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
                  <Upload className="w-7 h-7 text-[#2563eb]" />
                </div>
                <div>
                  <h3 className="text-lg text-[#1e293b] font-semibold">Importación Masiva CSV</h3>
                  <p className="text-sm text-[#64748b]">Carga 500 alumnos en 30 segundos. Solo sube un archivo CSV con los datos y listo.</p>
                </div>
              </div>
              <button
                onClick={onLogin}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
              >
                Probar Ahora <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles ──────────────────────────────────────── */}
      <section id="roles" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-[#2563eb] font-medium mb-2">TRES ROLES, UNA PLATAFORMA</p>
            <h2 className="text-3xl sm:text-4xl text-[#1e293b] font-bold mb-4">Cada usuario ve lo que necesita</h2>
            <p className="text-[#64748b] max-w-xl mx-auto">Director, profesor y padre/apoderado. Cada uno con su vista personalizada y permisos adecuados.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.role} className="rounded-2xl overflow-hidden border border-[#e2e8f0] bg-white">
                <div className={`bg-gradient-to-r ${role.color} p-6`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg text-white font-semibold">{role.role}</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-3">
                    {role.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="w-5 h-5 text-[#10b981] shrink-0 mt-0.5" />
                        <span className="text-sm text-[#64748b]">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-4 bg-[#f8f9fb]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-[#2563eb] font-medium mb-2">PLANES</p>
            <h2 className="text-3xl sm:text-4xl text-[#1e293b] font-bold mb-4">Simple, transparente, sin sorpresas</h2>
            <p className="text-[#64748b] max-w-xl mx-auto">Empieza gratis y crece según tus necesidades. Sin contratos a largo plazo.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-6 ${
                  plan.highlighted
                    ? "bg-[#2563eb] text-white ring-4 ring-[#2563eb]/20 scale-[1.02]"
                    : "bg-white border border-[#e2e8f0]"
                }`}
              >
                {plan.highlighted && (
                  <p className="text-xs text-[#93c5fd] font-medium uppercase tracking-wider mb-4">Más popular</p>
                )}
                <h3 className={`text-xl font-semibold mb-1 ${plan.highlighted ? "text-white" : "text-[#1e293b]"}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-4 ${plan.highlighted ? "text-[#93c5fd]" : "text-[#64748b]"}`}>
                  {plan.description}
                </p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-bold ${plan.highlighted ? "text-white" : "text-[#1e293b]"}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.highlighted ? "text-[#93c5fd]" : "text-[#64748b]"}`}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlighted ? "text-[#93c5fd]" : "text-[#10b981]"}`} />
                      <span className={`text-sm ${plan.highlighted ? "text-white/90" : "text-[#64748b]"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={onLogin}
                  className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                    plan.highlighted
                      ? "bg-white text-[#2563eb] hover:bg-[#f8fafc]"
                      : "bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm text-[#2563eb] font-medium mb-2">TESTIMONIOS</p>
            <h2 className="text-3xl sm:text-4xl text-[#1e293b] font-bold mb-4">Lo que dicen nuestros usuarios</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-[#e2e8f0]">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#f59e0b] fill-[#f59e0b]" />
                  ))}
                </div>
                <p className="text-sm text-[#64748b] leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#e2e8f0]">
                  <div className="w-10 h-10 rounded-full bg-[#eff6ff] flex items-center justify-center">
                    <span className="text-sm text-[#2563eb]">
                      {t.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-[#1e293b] font-medium">{t.name}</p>
                    <p className="text-xs text-[#64748b]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#2563eb]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl text-white font-bold mb-4">
            Empieza a transformar tu colegio hoy
          </h2>
          <p className="text-lg text-[#93c5fd] mb-8 max-w-xl mx-auto">
            Regístrate gratis, importa tus alumnos y empieza a usar la plataforma en minutos. Sin tarjeta de crédito.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-[#2563eb] rounded-xl hover:bg-[#f8fafc] transition-colors text-base font-medium"
            >
              Crear Cuenta Gratis <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 border border-white/30 text-white rounded-xl hover:bg-white/10 transition-colors text-base"
            >
              Ver Demo en Vivo
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="bg-[#1e293b] py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#2563eb] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-white font-semibold">Tu Escuela</span>
              </div>
              <p className="text-sm text-[#94a3b8] leading-relaxed">
                Sistema de gestión escolar moderno para colegios en Perú. Simple, seguro y accesible.
              </p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Producto</h4>
              <ul className="space-y-2">
                <li><button onClick={() => scrollTo("features")} className="text-sm text-[#94a3b8] hover:text-white transition-colors">Funcionalidades</button></li>
                <li><button onClick={() => scrollTo("pricing")} className="text-sm text-[#94a3b8] hover:text-white transition-colors">Precios</button></li>
                <li><button onClick={() => scrollTo("roles")} className="text-sm text-[#94a3b8] hover:text-white transition-colors">Roles</button></li>
                <li><button onClick={onLogin} className="text-sm text-[#94a3b8] hover:text-white transition-colors">Demo</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-[#94a3b8]">soporte@tuescuela.pe</span></li>
                <li><span className="text-sm text-[#94a3b8]">+51 999 999 999</span></li>
                <li><span className="text-sm text-[#94a3b8]">Lun - Vie, 8am - 6pm</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><span className="text-sm text-[#94a3b8]">Términos de servicio</span></li>
                <li><span className="text-sm text-[#94a3b8]">Política de privacidad</span></li>
                <li><span className="text-sm text-[#94a3b8]">Protección de datos</span></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-[#334155]">
            <p className="text-center text-sm text-[#64748b]">
              &copy; {new Date().getFullYear()} Tu Escuela. Todos los derechos reservados. Hecho con amor en Perú.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
