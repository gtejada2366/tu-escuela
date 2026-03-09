import { Link } from "react-router";
import { AlertCircle } from "lucide-react";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="p-4 rounded-full bg-[#fee2e2] mb-4">
        <AlertCircle className="w-12 h-12 text-[#dc2626]" />
      </div>
      <h1 className="text-2xl text-[#1e293b] mb-2">Página no encontrada</h1>
      <p className="text-sm text-[#64748b] mb-6">
        La página que estás buscando no existe o ha sido eliminada.
      </p>
      <Link
        to="/"
        className="px-4 py-2 bg-[#2563eb] text-white rounded-lg hover:bg-[#1d4ed8] transition-colors text-sm"
      >
        Volver al Dashboard
      </Link>
    </div>
  );
}
