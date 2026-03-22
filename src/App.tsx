import { Suspense, useState, useEffect } from "react";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastProvider } from "./components/Toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SchoolConfigProvider } from "./contexts/SchoolConfigContext";
import { Login } from "./pages/Login";
import { ResetPassword } from "./pages/ResetPassword";
import { Landing } from "./pages/Landing";
import { Signup } from "./pages/Signup";
import { Onboarding } from "./pages/Onboarding";
import { supabase } from "./lib/supabase";

type AuthView = "landing" | "login" | "signup";

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>("landing");
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);

  // Check if school needs onboarding (no academic years yet)
  useEffect(() => {
    if (!user || !supabase) { setNeedsOnboarding(false); return; }

    // Check localStorage cache first
    if (user.school_id && localStorage.getItem(`onboarding_complete_${user.school_id}`)) {
      setNeedsOnboarding(false);
      return;
    }

    supabase
      .from("academic_years")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => {
        setNeedsOnboarding(count === 0);
      });
  }, [user]);

  const spinner = (
    <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-[#64748b]">Cargando...</p>
      </div>
    </div>
  );

  if (loading) return spinner;

  if (!user) {
    if (window.location.pathname === "/reset-password") return <ResetPassword />;
    if (authView === "signup") return <Signup onBack={() => setAuthView("landing")} onLogin={() => setAuthView("login")} />;
    if (authView === "login") return <Login onBack={() => setAuthView("landing")} onSignup={() => setAuthView("signup")} />;
    return <Landing onLogin={() => setAuthView("login")} onSignup={() => setAuthView("signup")} />;
  }

  // Wait for onboarding check
  if (needsOnboarding === null) return spinner;

  // Show onboarding wizard for new schools
  if (needsOnboarding) {
    return <Onboarding onComplete={() => setNeedsOnboarding(false)} />;
  }

  return (
    <Suspense fallback={spinner}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <SchoolConfigProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </SchoolConfigProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
