/**
 * Auth Service
 * Handles authentication against Supabase Auth when configured,
 * falls back to in-memory demo auth when not.
 */
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import type { Profile } from "../types/database";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "director" | "profesor";
  avatar: string;
  status: "active" | "inactive";
}

// ── Supabase Auth ────────────────────────────────────────────

async function supabaseLogin(email: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!supabase) return { user: null, error: "Supabase no configurado" };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { user: null, error: error.message === "Invalid login credentials" ? "Correo o contraseña incorrectos" : error.message };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile) return { user: null, error: "Perfil no encontrado" };
  if (profile.status === "inactive") {
    await supabase.auth.signOut();
    return { user: null, error: "Tu cuenta está desactivada. Contacta al director." };
  }

  return {
    user: {
      id: profile.id,
      name: profile.name,
      email: data.user.email ?? email,
      role: profile.role as "director" | "profesor",
      avatar: profile.avatar ?? profile.name.substring(0, 2).toUpperCase(),
      status: profile.status as "active" | "inactive",
    },
    error: null,
  };
}

async function supabaseLogout(): Promise<void> {
  await supabase?.auth.signOut();
}

async function supabaseChangePassword(newPassword: string): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return error ? error.message : null;
}

async function supabaseGetSession(): Promise<AuthUser | null> {
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.status === "inactive") return null;

  return {
    id: profile.id,
    name: profile.name,
    email: session.user.email ?? "",
    role: profile.role as "director" | "profesor",
    avatar: profile.avatar ?? profile.name.substring(0, 2).toUpperCase(),
    status: profile.status as "active" | "inactive",
  };
}

async function supabaseUpdateProfile(data: { name?: string; email?: string }): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return "No autenticado";

  if (data.email) {
    const { error } = await supabase.auth.updateUser({ email: data.email });
    if (error) return error.message;
  }

  if (data.name) {
    const { error } = await supabase.from("profiles").update({ name: data.name }).eq("id", user.id);
    if (error) return error.message;
  }

  return null;
}

// ── User Management (Director only) ─────────────────────────

async function supabaseGetAllUsers(): Promise<Profile[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("profiles").select("*").order("name");
  return data ?? [];
}

async function supabaseCreateUser(userData: { name: string; email: string; password: string; role: "director" | "profesor" }): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";

  // Use Supabase Admin API via edge function or service role
  // For now, use signUp (user will need to confirm email unless disabled)
  const { error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: { name: userData.name, role: userData.role },
    },
  });

  return error ? error.message : null;
}

async function supabaseUpdateUser(userId: string, data: Partial<Pick<Profile, "name" | "email" | "role" | "status" | "phone" | "address" | "specializations" | "assigned_grades">>): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.from("profiles").update(data).eq("id", userId);
  return error ? error.message : null;
}

// ── Password Reset ───────────────────────────────────────────

async function supabaseResetPassword(email: string): Promise<string | null> {
  if (!supabase) return "Supabase no configurado";
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return error ? error.message : null;
}

// ── Public API ───────────────────────────────────────────────

export const authService = {
  isEnabled: isSupabaseEnabled,
  login: supabaseLogin,
  logout: supabaseLogout,
  changePassword: supabaseChangePassword,
  resetPassword: supabaseResetPassword,
  getSession: supabaseGetSession,
  updateProfile: supabaseUpdateProfile,
  getAllUsers: supabaseGetAllUsers,
  createUser: supabaseCreateUser,
  updateUser: supabaseUpdateUser,
};
