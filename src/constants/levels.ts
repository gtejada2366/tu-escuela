export interface Grade {
  id: string;
  label: string;
  level: string;
}

export const LEVELS = [
  { id: "inicial", label: "Inicial" },
  { id: "primaria", label: "Primaria" },
  { id: "secundaria", label: "Secundaria" },
] as const;

export const GRADES: Grade[] = [
  // Inicial - 3 grados
  { id: "inicial-3", label: "3 años", level: "inicial" },
  { id: "inicial-4", label: "4 años", level: "inicial" },
  { id: "inicial-5", label: "5 años", level: "inicial" },
  // Primaria - 6 grados
  { id: "primaria-1", label: "1° Primaria", level: "primaria" },
  { id: "primaria-2", label: "2° Primaria", level: "primaria" },
  { id: "primaria-3", label: "3° Primaria", level: "primaria" },
  { id: "primaria-4", label: "4° Primaria", level: "primaria" },
  { id: "primaria-5", label: "5° Primaria", level: "primaria" },
  { id: "primaria-6", label: "6° Primaria", level: "primaria" },
  // Secundaria - 5 grados
  { id: "secundaria-1", label: "1° Secundaria", level: "secundaria" },
  { id: "secundaria-2", label: "2° Secundaria", level: "secundaria" },
  { id: "secundaria-3", label: "3° Secundaria", level: "secundaria" },
  { id: "secundaria-4", label: "4° Secundaria", level: "secundaria" },
  { id: "secundaria-5", label: "5° Secundaria", level: "secundaria" },
];

export const GRADES_BY_LEVEL = {
  inicial: GRADES.filter((g) => g.level === "inicial"),
  primaria: GRADES.filter((g) => g.level === "primaria"),
  secundaria: GRADES.filter((g) => g.level === "secundaria"),
};

export const LEVEL_LABELS: Record<string, string> = {
  inicial: "Inicial",
  primaria: "Primaria",
  secundaria: "Secundaria",
};
