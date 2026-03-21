import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { useAuth } from "./AuthContext";

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

function loadLocalConfig(): SchoolConfig {
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
  const { user } = useAuth();
  const [config, setConfig] = useState<SchoolConfig>(loadLocalConfig);

  // Load config from schools table when user is authenticated
  useEffect(() => {
    if (!isSupabaseEnabled() || !supabase || !user?.school_id) return;

    supabase
      .from("schools")
      .select("name, tagline, logo_url")
      .eq("id", user.school_id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const next: SchoolConfig = {
            schoolName: data.name,
            tagline: data.tagline ?? defaults.tagline,
            logoUrl: data.logo_url ?? "",
          };
          setConfig(next);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        }
      });
  }, [user?.school_id]);

  useEffect(() => {
    document.title = config.schoolName;
  }, [config.schoolName]);

  const updateConfig = useCallback((updates: Partial<SchoolConfig>) => {
    setConfig((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

      // Persist to schools table if connected
      if (isSupabaseEnabled() && supabase && user?.school_id) {
        const dbUpdates: Record<string, string> = {};
        if (updates.schoolName !== undefined) dbUpdates.name = updates.schoolName;
        if (updates.tagline !== undefined) dbUpdates.tagline = updates.tagline;
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
        if (Object.keys(dbUpdates).length > 0) {
          supabase.from("schools").update(dbUpdates).eq("id", user.school_id).then(() => {});
        }
      }

      return next;
    });
  }, [user?.school_id]);

  return (
    <SchoolConfigContext.Provider value={{ ...config, updateConfig }}>
      {children}
    </SchoolConfigContext.Provider>
  );
}

export function useSchoolConfig() {
  return useContext(SchoolConfigContext);
}
