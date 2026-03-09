import { useState, useEffect, useCallback } from "react";
import { isSupabaseEnabled } from "../lib/supabase";
import { authService } from "../services/auth.service";
import { classesService } from "../services/classes.service";

export interface Professor {
  id: number;
  uid?: string;
  name: string;
  subject: string;
  grades: string;
  classes: number;
  status: "active" | "inactive";
  avatar: string;
  phone: string;
  address: string;
}

const demoProfessors: Professor[] = [
  { id: 1, name: "Carlos Mendoza Ruiz", subject: "Matemáticas", grades: "3° Primaria, 4° Primaria, 1° Secundaria", classes: 8, status: "active", avatar: "CM", phone: "+51 987 654 321", address: "Av. Los Pinos 456, San Isidro" },
  { id: 2, name: "Ana Sofía Reyes Torres", subject: "Comunicación", grades: "1° Primaria, 2° Primaria, 3° Primaria", classes: 6, status: "active", avatar: "AR", phone: "+51 976 543 210", address: "Jr. Las Magnolias 789, Miraflores" },
  { id: 3, name: "Roberto García Mendez", subject: "Ciencias", grades: "1° Secundaria, 2° Secundaria, 3° Secundaria", classes: 7, status: "active", avatar: "RG", phone: "+51 965 432 109", address: "Calle San Martín 234, Surco" },
  { id: 4, name: "María Fernanda López", subject: "Historia", grades: "4° Secundaria, 5° Secundaria", classes: 5, status: "inactive", avatar: "ML", phone: "+51 954 321 098", address: "Av. Arequipa 567, Lince" },
  { id: 5, name: "José Luis Paredes Silva", subject: "Educación Física", grades: "3 años, 4 años, 5 años, 1° Primaria", classes: 9, status: "active", avatar: "JP", phone: "+51 943 210 987", address: "Jr. Cusco 890, Jesús María" },
  { id: 6, name: "Patricia Campos Rojas", subject: "Inglés", grades: "5 años, 1° Primaria, 2° Primaria", classes: 7, status: "active", avatar: "PC", phone: "+51 932 109 876", address: "Av. La Marina 123, San Miguel" },
  { id: 7, name: "Fernando Díaz Castro", subject: "Arte y Cultura", grades: "3 años, 4 años, 5 años", classes: 6, status: "active", avatar: "FD", phone: "+51 921 098 765", address: "Calle Los Laureles 456, Pueblo Libre" },
  { id: 8, name: "Gabriela Núñez Vega", subject: "Matemáticas", grades: "5° Primaria, 6° Primaria", classes: 5, status: "active", avatar: "GN", phone: "+51 910 987 654", address: "Av. Universitaria 789, San Martín de Porres" },
];

export const SUBJECTS = [
  "Matemáticas",
  "Comunicación",
  "Ciencias",
  "Historia",
  "Educación Física",
  "Inglés",
  "Arte y Cultura",
];

export function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() ?? "" : "";
  return first + last;
}

export function useProfesoresData() {
  const [professors, setProfessors] = useState<Professor[]>(demoProfessors);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseEnabled()) return;
    setLoading(true);
    setError(null);

    Promise.all([
      authService.getAllUsers(),
      classesService.getAll(),
    ]).then(([profiles, classes]) => {
      const professorProfiles = profiles.filter((p) => p.role === "profesor");
      if (professorProfiles.length > 0) {
        const mapped = professorProfiles.map((p, idx) => {
          const teacherClasses = classes.filter((c) => c.teacher_id === p.id);
          const subjects = [...new Set(teacherClasses.map((c) => c.subject))];
          const grades = [...new Set(teacherClasses.map((c) => `${c.grade} ${c.section}`))];
          return {
            id: idx + 1,
            uid: p.id,
            name: p.name,
            subject: subjects.join(", ") || "Sin asignar",
            grades: grades.join(", ") || "Sin asignar",
            classes: teacherClasses.length,
            status: p.status as "active" | "inactive",
            avatar: p.avatar ?? generateAvatar(p.name),
            phone: "",
            address: "",
          };
        });
        setProfessors(mapped);
      }
      setLoading(false);
    }).catch(() => {
      setError("Error al cargar los datos. Verifica tu conexión.");
      setLoading(false);
    });
  }, []);

  const addProfessor = useCallback(async (data: Omit<Professor, "id" | "avatar" | "classes">) => {
    const avatar = generateAvatar(data.name);

    if (isSupabaseEnabled()) {
      const err = await authService.createUser({
        name: data.name,
        email: `${data.name.toLowerCase().replace(/\s+/g, ".")}@escuela.edu.pe`,
        password: "Temporal123!",
        role: "profesor",
      });
      if (err) console.error("addProfessor:", err);
    }

    const newId = Math.max(0, ...professors.map((p) => p.id)) + 1;
    const newProfessor: Professor = { id: newId, ...data, classes: 0, avatar };
    setProfessors((prev) => [...prev, newProfessor]);
    return newProfessor;
  }, [professors]);

  const updateProfessor = useCallback(async (id: number, data: Partial<Professor>) => {
    const avatar = data.name ? generateAvatar(data.name) : undefined;

    if (isSupabaseEnabled()) {
      const prof = professors.find((p) => p.id === id);
      if (prof?.uid) {
        await authService.updateUser(prof.uid, {
          ...(data.name && { name: data.name }),
          ...(data.status && { status: data.status }),
        });
      }
    }

    setProfessors((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...data, ...(avatar ? { avatar } : {}) } : p
      )
    );
  }, [professors]);

  const removeProfessor = useCallback(async (id: number) => {
    if (isSupabaseEnabled()) {
      const prof = professors.find((p) => p.id === id);
      if (prof?.uid) {
        await authService.updateUser(prof.uid, { status: "inactive" });
      }
    }
    setProfessors((prev) => prev.filter((p) => p.id !== id));
  }, [professors]);

  return { professors, setProfessors, loading, error, addProfessor, updateProfessor, removeProfessor };
}
