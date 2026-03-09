import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { SchoolConfigProvider } from "./contexts/SchoolConfigContext";
import { Login } from "./pages/Login";
import { ResetPassword } from "./pages/ResetPassword";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fb] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-[#64748b]">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (window.location.pathname === "/reset-password") return <ResetPassword />;
    return <Login />;
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <SchoolConfigProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </SchoolConfigProvider>
  );
}
