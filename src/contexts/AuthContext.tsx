import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseEnabled } from "../lib/supabase";
import { authService } from "../services/auth.service";
import { validatePassword } from "../lib/validation";

export type Role = "director" | "profesor";

export interface AppUser {
  id: number;
  /** Supabase UUID — present only when connected to backend */
  uid?: string;
  name: string;
  role: Role;
  avatar: string;
  email: string;
}

export interface RegisteredUser extends AppUser {
  password: string;
  status: "active" | "inactive";
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
  isDirector: boolean;
  isProfesor: boolean;
  changePassword: (oldPassword: string, newPassword: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  updateCurrentUser: (data: { name: string; email: string }) => Promise<void>;
  usersRegistry: RegisteredUser[];
  addUser: (user: Omit<RegisteredUser, "id" | "avatar">) => Promise<void>;
  updateUser: (id: number, data: Partial<Omit<RegisteredUser, "id">>) => Promise<void>;
  removeUser: (id: number) => Promise<void>;
}

function generateAvatar(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0]?.toUpperCase() ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0]?.toUpperCase() ?? "" : "";
  return first + last;
}

// ── Demo data (used when Supabase is NOT configured) ─────────
const initialRegistry: RegisteredUser[] = [
  { id: 1, name: "Admin Director", email: "director@tuescuela.edu.pe", role: "director", status: "active", avatar: "AD", password: "admin" },
  { id: 2, name: "Carlos Mendoza Ruiz", email: "cmendoza@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "CM", password: "admin" },
  { id: 3, name: "Ana Sofía Reyes Torres", email: "areyes@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "AR", password: "admin" },
  { id: 4, name: "Roberto García Mendez", email: "rgarcia@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "RG", password: "admin" },
  { id: 5, name: "María Fernanda López", email: "mlopez@tuescuela.edu.pe", role: "profesor", status: "inactive", avatar: "ML", password: "admin" },
  { id: 6, name: "José Luis Paredes Silva", email: "jparedes@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "JP", password: "admin" },
  { id: 7, name: "Patricia Campos Rojas", email: "pcampos@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "PC", password: "admin" },
  { id: 8, name: "Fernando Díaz Castro", email: "fdiaz@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "FD", password: "admin" },
  { id: 9, name: "Gabriela Núñez Vega", email: "gnunez@tuescuela.edu.pe", role: "profesor", status: "active", avatar: "GN", password: "admin" },
  { id: 10, name: "Subdirector Académico", email: "subdirector@tuescuela.edu.pe", role: "director", status: "active", avatar: "SA", password: "admin" },
];

/** Fetch all profiles from Supabase and map to RegisteredUser[] */
async function fetchSupabaseProfiles(): Promise<RegisteredUser[]> {
  const profiles = await authService.getAllUsers();
  return profiles.map((p, idx) => ({
    id: idx + 1,
    uid: p.id,
    name: p.name,
    email: p.email ?? "",
    role: p.role as Role,
    status: p.status as "active" | "inactive",
    avatar: p.avatar ?? generateAvatar(p.name),
    password: "",
  }));
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [usersRegistry, setUsersRegistry] = useState<RegisteredUser[]>(initialRegistry);
  const [loading, setLoading] = useState(isSupabaseEnabled());

  // ── Supabase: restore session on mount ───────────────────
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    const sb = supabase;

    sb.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const { data: profile, error: profileError } = await sb
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        if (profileError) {
          console.error("Session restore: error loading profile", profileError);
        } else if (profile && profile.status === "active") {
          setUser({
            id: 0,
            uid: profile.id,
            name: profile.name,
            role: profile.role as Role,
            avatar: profile.avatar ?? generateAvatar(profile.name),
            email: session.user.email ?? "",
          });
          // Load all profiles into registry so Roles page works
          fetchSupabaseProfiles()
            .then((profiles) => setUsersRegistry(profiles))
            .catch(() => {});
        } else if (profile && profile.status === "inactive") {
          // Account deactivated — sign out so login screen shows
          await sb.auth.signOut({ scope: "local" });
        }
      }
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
      } else if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        try {
          const { data: profile, error: profileError } = await sb
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          if (profileError) {
            console.error("onAuthStateChange: error loading profile", profileError);
            return;
          }
          if (profile && profile.status === "active") {
            setUser({
              id: 0,
              uid: profile.id,
              name: profile.name,
              role: profile.role as Role,
              avatar: profile.avatar ?? generateAvatar(profile.name),
              email: session.user.email ?? "",
            });
          } else if (profile && profile.status === "inactive") {
            await sb.auth.signOut({ scope: "local" });
          }
        } catch {
          // Profile lookup failed — leave user unset
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Login ────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    // Supabase mode
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos"
          : error.message;
      }
      if (!data.user) return "Error de autenticación";

      // Ensure the new session is active before querying
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return "Error al establecer la sesión";

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error al consultar perfil:", profileError);
        return `Error al cargar perfil: ${profileError.message}`;
      }
      if (!profile) return "Perfil no encontrado. Contacta al administrador.";
      if (profile.status === "inactive") {
        await supabase.auth.signOut({ scope: "local" });
        return "Esta cuenta está desactivada. Contacta al director.";
      }
      setUser({
        id: 0,
        uid: profile.id,
        name: profile.name,
        role: profile.role as Role,
        avatar: profile.avatar ?? generateAvatar(profile.name),
        email: session.user.email ?? email,
      });
      return null;
    }

    // Demo mode
    const found = usersRegistry.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return "Usuario no encontrado";
    if (found.status === "inactive") return "Esta cuenta está inactiva";
    if (found.password !== password) return "Contraseña incorrecta";
    setUser({ id: found.id, name: found.name, role: found.role, avatar: found.avatar, email: found.email });
    return null;
  }, [usersRegistry]);

  // ── Logout ───────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (supabase) { await supabase.auth.signOut({ scope: "local" }); }
    setUser(null);
  }, []);

  // ── Change password ──────────────────────────────────────
  const changePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<string | null> => {
    if (!user) return "No has iniciado sesión";
    const pwError = validatePassword(newPassword);
    if (pwError) return pwError;

    if (supabase) {
      // Verify old password by re-authenticating
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession) return "Sesión expirada";
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: currentSession.user.email!,
        password: oldPassword,
      });
      if (verifyError) return "La contraseña actual es incorrecta";
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      return error ? error.message : null;
    }

    // Demo mode
    const found = usersRegistry.find((u) => u.id === user.id);
    if (!found) return "Usuario no encontrado";
    if (found.password !== oldPassword) return "La contraseña actual es incorrecta";
    setUsersRegistry((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, password: newPassword } : u))
    );
    return null;
  }, [user, usersRegistry]);

  // ── Reset password ─────────────────────────────────────
  const resetPassword = useCallback(async (email: string): Promise<string | null> => {
    if (isSupabaseEnabled()) {
      return authService.resetPassword(email);
    }
    // Demo mode: just pretend it worked
    return null;
  }, []);

  // ── Update profile ───────────────────────────────────────
  const updateCurrentUser = useCallback(async (data: { name: string; email: string }) => {
    if (!user) return;
    const avatar = generateAvatar(data.name);

    if (supabase && user.uid) {
      await supabase.from("profiles").update({ name: data.name, avatar }).eq("id", user.uid);
      if (data.email !== user.email) {
        await supabase.auth.updateUser({ email: data.email });
      }
    }

    setUser((prev) => prev ? { ...prev, name: data.name, email: data.email, avatar } : prev);
    setUsersRegistry((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, name: data.name, email: data.email, avatar } : u))
    );
  }, [user]);

  // ── User management (Director) ──────────────────────────
  const addUser = useCallback(async (userData: Omit<RegisteredUser, "id" | "avatar">) => {
    if (supabase) {
      // Save the director's session before signUp (signUp auto-signs-in the new user)
      const { data: { session: directorSession } } = await supabase.auth.getSession();

      const { error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: { data: { name: userData.name, role: userData.role } },
      });
      if (error) throw new Error(error.message);

      // Restore the director's session so they stay logged in
      if (directorSession) {
        await supabase.auth.setSession({
          access_token: directorSession.access_token,
          refresh_token: directorSession.refresh_token,
        });
      }

      // Profile is auto-created by trigger — reload registry
      const profiles = await fetchSupabaseProfiles();
      setUsersRegistry(profiles);
      return;
    }

    // Demo mode
    const newId = Math.max(0, ...usersRegistry.map((u) => u.id)) + 1;
    setUsersRegistry((prev) => [
      ...prev,
      { ...userData, id: newId, avatar: generateAvatar(userData.name) },
    ]);
  }, [usersRegistry]);

  const updateUser = useCallback(async (id: number, data: Partial<Omit<RegisteredUser, "id">>) => {
    if (supabase) {
      const target = usersRegistry.find((u) => u.id === id);
      if (target?.uid) {
        const profileData: Partial<Pick<import("../types/database").Profile, "name" | "email" | "role" | "status">> = {};
        if (data.name) profileData.name = data.name;
        if (data.email) profileData.email = data.email;
        if (data.role) profileData.role = data.role;
        if (data.status) profileData.status = data.status;
        const error = await authService.updateUser(target.uid, profileData);
        if (error) throw new Error(error);
      }
      // Reload registry from Supabase to reflect changes
      const profiles = await fetchSupabaseProfiles();
      setUsersRegistry(profiles);
    } else {
      // Demo mode
      setUsersRegistry((prev) =>
        prev.map((u) => {
          if (u.id !== id) return u;
          const updated = { ...u, ...data };
          if (data.name) updated.avatar = generateAvatar(data.name);
          return updated;
        })
      );
    }
    // Update current user if they edited themselves
    if (user && user.id === id && (data.name || data.email || data.role)) {
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        if (data.name) { updated.name = data.name; updated.avatar = generateAvatar(data.name); }
        if (data.email) updated.email = data.email;
        if (data.role) updated.role = data.role;
        return updated;
      });
    }
  }, [user, usersRegistry]);

  const removeUser = useCallback(async (id: number) => {
    if (supabase) {
      const target = usersRegistry.find((u) => u.id === id);
      if (target?.uid) {
        const error = await authService.updateUser(target.uid, { status: "inactive" });
        if (error) throw new Error(error);
      }
      // Reload registry from Supabase to reflect changes
      const profiles = await fetchSupabaseProfiles();
      setUsersRegistry(profiles);
      return;
    }
    // Demo mode
    setUsersRegistry((prev) => prev.filter((u) => u.id !== id));
  }, [usersRegistry]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isDirector: user?.role === "director",
        isProfesor: user?.role === "profesor",
        changePassword,
        resetPassword,
        updateCurrentUser,
        usersRegistry,
        addUser,
        updateUser,
        removeUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
