import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-[#10b981]" />,
    error: <AlertCircle className="w-5 h-5 text-[#dc2626]" />,
    info: <Info className="w-5 h-5 text-[#2563eb]" />,
  };

  const bgColors = {
    success: "bg-[#f0fdf4] border-[#10b981]",
    error: "bg-[#fef2f2] border-[#dc2626]",
    info: "bg-[#eff6ff] border-[#2563eb]",
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColors[toast.type]} animate-slide-in min-w-[300px]`}>
      {icons[toast.type]}
      <span className="text-sm text-[#1e293b] flex-1">{toast.message}</span>
      <button onClick={() => onRemove(toast.id)} className="p-0.5 hover:bg-black/5 rounded">
        <X className="w-4 h-4 text-[#64748b]" />
      </button>
    </div>
  );
}
