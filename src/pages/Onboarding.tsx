import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useSchoolConfig } from "../contexts/SchoolConfigContext";
import { useAuth } from "../contexts/AuthContext";
import {
  GraduationCap,
  Building2,
  Calendar,
  Users,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Rocket,
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

interface StudentRow {
  name: string;
  grade: string;
  section: string;
}

const STEPS = [
  { icon: Building2, label: "Tu Colegio" },
  { icon: Calendar, label: "Año Académico" },
  { icon: Users, label: "Estudiantes" },
  { icon: BookOpen, label: "Clase" },
  { icon: Rocket, label: "Listo" },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const { schoolName, tagline, logoUrl, updateConfig } = useSchoolConfig();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Step 1: School config
  const [schoolForm, setSchoolForm] = useState({
    name: schoolName,
    tagline: tagline,
    logoUrl: logoUrl,
  });

  // Step 2: Academic year
  const [yearForm, setYearForm] = useState({
    name: new Date().getFullYear().toString(),
    startDate: `${new Date().getFullYear()}-03-01`,
    endDate: `${new Date().getFullYear()}-12-20`,
  });
  const [createdYearId, setCreatedYearId] = useState<number | null>(null);

  // Step 3: Students
  const [students, setStudents] = useState<StudentRow[]>([
    { name: "", grade: "", section: "A" },
  ]);
  const [addedStudents, setAddedStudents] = useState(0);

  // Step 4: Class
  const [classForm, setClassForm] = useState({
    subject: "",
    grade: "",
    section: "A",
    schedule: "",
    classroom: "",
  });

  const next = () => { setError(""); setStep((s) => Math.min(s + 1, 4)); };
  const prev = () => { setError(""); setStep((s) => Math.max(s - 1, 0)); };

  // Step 1: Save school config
  const saveSchool = () => {
    if (schoolForm.name.trim()) {
      updateConfig({
        schoolName: schoolForm.name.trim(),
        tagline: schoolForm.tagline.trim() || "Sistema de Gestión Escolar",
        logoUrl: schoolForm.logoUrl.trim(),
      });
    }
    next();
  };

  // Step 2: Create academic year
  const saveYear = async () => {
    if (!supabase) { next(); return; }
    if (!yearForm.name.trim()) { setError("Ingresa el nombre del año académico"); return; }

    setSaving(true);
    const { data, error: err } = await supabase
      .from("academic_years")
      .insert({
        name: yearForm.name.trim(),
        start_date: yearForm.startDate,
        end_date: yearForm.endDate,
        is_active: true,
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
    } else {
      setCreatedYearId(data.id);
      next();
    }
    setSaving(false);
  };

  // Step 3: Add students
  const addStudentRow = () => {
    setStudents((prev) => [...prev, { name: "", grade: "", section: "A" }]);
  };

  const removeStudentRow = (idx: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateStudentRow = (idx: number, field: keyof StudentRow, value: string) => {
    setStudents((prev) => prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s)));
  };

  const saveStudents = async () => {
    if (!supabase) { next(); return; }

    const validStudents = students.filter((s) => s.name.trim() && s.grade.trim());
    if (validStudents.length === 0) { next(); return; } // Skip if empty

    setSaving(true);
    const inserts = validStudents.map((s) => ({
      name: s.name.trim(),
      grade: s.grade.trim(),
      section: s.section.trim() || "A",
      status: "active" as const,
      academic_year_id: createdYearId,
    }));

    const { error: err } = await supabase.from("students").insert(inserts);
    if (err) {
      setError(err.message);
    } else {
      setAddedStudents(validStudents.length);
      next();
    }
    setSaving(false);
  };

  // Step 4: Create class
  const saveClass = async () => {
    if (!supabase) { next(); return; }
    if (!classForm.subject.trim() || !classForm.grade.trim()) { next(); return; }

    setSaving(true);
    const { error: err } = await supabase.from("classes").insert({
      subject: classForm.subject.trim(),
      grade: classForm.grade.trim(),
      section: classForm.section.trim() || "A",
      schedule: classForm.schedule.trim() || null,
      classroom: classForm.classroom.trim() || null,
      teacher_id: user?.uid || null,
      status: "active" as const,
      academic_year_id: createdYearId,
    });

    if (err) {
      setError(err.message);
    } else {
      next();
    }
    setSaving(false);
  };

  // Step 5: Complete
  const finish = () => {
    if (user?.school_id) {
      localStorage.setItem(`onboarding_complete_${user.school_id}`, "1");
    }
    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fb] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-1 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${
                  i < step
                    ? "bg-[#10b981] text-white"
                    : i === step
                    ? "bg-[#2563eb] text-white"
                    : "bg-[#e2e8f0] text-[#94a3b8]"
                }`}
              >
                {i < step ? <CheckCircle2 className="w-5 h-5" /> : <s.icon className="w-4 h-4" />}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${i < step ? "bg-[#10b981]" : "bg-[#e2e8f0]"}`} />
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-[#64748b] mb-4">
          Paso {step + 1} de {STEPS.length}: {STEPS[step].label}
        </p>

        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6">
          {/* ── Step 1: School Config ── */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg text-[#1e293b] font-semibold">Personaliza tu Colegio</h2>
                <p className="text-sm text-[#64748b]">Esta información aparecerá en toda la plataforma</p>
              </div>

              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Nombre del Colegio</label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Lema o Descripción</label>
                <input
                  type="text"
                  value={schoolForm.tagline}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, tagline: e.target.value }))}
                  placeholder="Formando líderes del futuro"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>

              <div>
                <label className="block text-sm text-[#1e293b] mb-1">URL del Logo (opcional)</label>
                <input
                  type="text"
                  value={schoolForm.logoUrl}
                  onChange={(e) => setSchoolForm((f) => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://ejemplo.com/logo.png"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={next} className="flex-1 text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  Omitir
                </button>
                <button
                  onClick={saveSchool}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2: Academic Year ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg text-[#1e293b] font-semibold">Año Académico</h2>
                <p className="text-sm text-[#64748b]">Crea tu primer año académico para organizar todo</p>
              </div>

              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Nombre</label>
                <input
                  type="text"
                  value={yearForm.name}
                  onChange={(e) => setYearForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="2026"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Inicio</label>
                  <input
                    type="date"
                    value={yearForm.startDate}
                    onChange={(e) => setYearForm((f) => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Fin</label>
                  <input
                    type="date"
                    value={yearForm.endDate}
                    onChange={(e) => setYearForm((f) => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={prev} className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button
                  onClick={saveYear}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Crear Año Académico"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Students ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg text-[#1e293b] font-semibold">Agrega Estudiantes</h2>
                <p className="text-sm text-[#64748b]">Puedes agregar más después desde el módulo de estudiantes</p>
              </div>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {students.map((s, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={s.name}
                      onChange={(e) => updateStudentRow(i, "name", e.target.value)}
                      placeholder="Nombre del alumno"
                      className="flex-1 px-3 py-2 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                    />
                    <input
                      type="text"
                      value={s.grade}
                      onChange={(e) => updateStudentRow(i, "grade", e.target.value)}
                      placeholder="Grado"
                      className="w-20 px-3 py-2 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                    />
                    <input
                      type="text"
                      value={s.section}
                      onChange={(e) => updateStudentRow(i, "section", e.target.value)}
                      placeholder="Sec"
                      className="w-14 px-3 py-2 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                    />
                    {students.length > 1 && (
                      <button
                        onClick={() => removeStudentRow(i)}
                        className="p-2 text-[#94a3b8] hover:text-[#dc2626] transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addStudentRow}
                className="flex items-center gap-1 text-sm text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
              >
                <Plus className="w-4 h-4" /> Agregar otro alumno
              </button>

              {error && <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={prev} className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button onClick={next} className="text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  Omitir
                </button>
                <button
                  onClick={saveStudents}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Guardar Estudiantes"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Class ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-2">
                <h2 className="text-lg text-[#1e293b] font-semibold">Crea tu Primera Clase</h2>
                <p className="text-sm text-[#64748b]">Puedes crear más clases después</p>
              </div>

              <div>
                <label className="block text-sm text-[#1e293b] mb-1">Materia</label>
                <input
                  type="text"
                  value={classForm.subject}
                  onChange={(e) => setClassForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Matemáticas"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Grado</label>
                  <input
                    type="text"
                    value={classForm.grade}
                    onChange={(e) => setClassForm((f) => ({ ...f, grade: e.target.value }))}
                    placeholder="1ro Primaria"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Sección</label>
                  <input
                    type="text"
                    value={classForm.section}
                    onChange={(e) => setClassForm((f) => ({ ...f, section: e.target.value }))}
                    placeholder="A"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Horario (opcional)</label>
                  <input
                    type="text"
                    value={classForm.schedule}
                    onChange={(e) => setClassForm((f) => ({ ...f, schedule: e.target.value }))}
                    placeholder="Lun-Mie 8:00"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#1e293b] mb-1">Aula (opcional)</label>
                  <input
                    type="text"
                    value={classForm.classroom}
                    onChange={(e) => setClassForm((f) => ({ ...f, classroom: e.target.value }))}
                    placeholder="Aula 101"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:outline-none focus:ring-2 focus:ring-[#2563eb] text-sm"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-[#dc2626] bg-[#fef2f2] px-3 py-2 rounded-lg">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={prev} className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </button>
                <button onClick={next} className="text-sm text-[#64748b] hover:text-[#1e293b] py-2.5 transition-colors">
                  Omitir
                </button>
                <button
                  onClick={saveClass}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50"
                >
                  {saving ? "Guardando..." : "Crear Clase"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 5: Done ── */}
          {step === 4 && (
            <div className="text-center py-4 space-y-6">
              <div className="w-16 h-16 rounded-full bg-[#ecfdf5] flex items-center justify-center mx-auto">
                <Rocket className="w-8 h-8 text-[#10b981]" />
              </div>

              <div>
                <h2 className="text-xl text-[#1e293b] font-semibold mb-2">¡Tu escuela está lista!</h2>
                <p className="text-sm text-[#64748b]">
                  Has configurado lo esencial. Ahora puedes explorar todas las funcionalidades.
                </p>
              </div>

              <div className="bg-[#f8f9fb] rounded-lg p-4 text-left space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                  <span className="text-[#1e293b]">Colegio configurado</span>
                </div>
                {createdYearId && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    <span className="text-[#1e293b]">Año académico {yearForm.name} creado</span>
                  </div>
                )}
                {addedStudents > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#10b981]" />
                    <span className="text-[#1e293b]">{addedStudents} estudiante{addedStudents > 1 ? "s" : ""} agregado{addedStudents > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              <button
                onClick={finish}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
              >
                Ir al Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
