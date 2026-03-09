import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface SchoolConfig {
  schoolName: string;
  tagline: string;
  logoUrl: string;
}

interface SchoolConfigContextType extends SchoolConfig {
  updateConfig: (updates: Partial<SchoolConfig>) => void;
}

const defaults: SchoolConfig = {
  schoolName: "Tu Escuela",
  tagline: "Sistema de Gestión Escolar",
  logoUrl: "",
};

const STORAGE_KEY = "school_config";

function loadConfig(): SchoolConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

const SchoolConfigContext = createContext<SchoolConfigContextType>({
  ...defaults,
  updateConfig: () => {},
});

export function SchoolConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SchoolConfig>(loadConfig);

  useEffect(() => {
    document.title = config.schoolName;
  }, [config.schoolName]);

  const updateConfig = useCallback((updates: Partial<SchoolConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SchoolConfigContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </SchoolConfigContext.Provider>
  );
}

export function useSchoolConfig() {
  return useContext(SchoolConfigContext);
}
