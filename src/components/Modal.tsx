import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className={`w-full ${sizeClasses[size]} bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg text-[#1e293b]">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#f1f5f9] transition-colors">
            <X className="w-5 h-5 text-[#64748b]" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
