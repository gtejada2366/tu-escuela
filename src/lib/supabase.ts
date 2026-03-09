import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase no configurado. La app usará datos de demostración.\n" +
    "Para conectar con Supabase, crea un archivo .env.local con:\n" +
    "  VITE_SUPABASE_URL=https://tu-proyecto.supabase.co\n" +
    "  VITE_SUPABASE_ANON_KEY=tu-anon-key"
  );
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey)
  : null;

/** Returns true when Supabase is configured and available */
export const isSupabaseEnabled = (): boolean => supabase !== null;
