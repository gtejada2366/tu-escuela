import { useEffect } from "react";
import { useBlocker } from "react-router";
import { Modal } from "./Modal";

export function UnsavedChangesGuard({ isDirty }: { isDirty: boolean }) {
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const blocker = useBlocker(isDirty);

  if (blocker.state !== "blocked") return null;

  return (
    <Modal isOpen onClose={() => blocker.reset()} title="Cambios sin guardar" size="sm">
      <div className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-[#fef3c7] flex items-center justify-center mb-4">
          <span className="text-xl text-[#d97706]">!</span>
        </div>
        <p className="text-sm text-[#64748b] mb-6">
          Tienes cambios sin guardar. Si sales ahora, se perderán.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => blocker.reset()}
            className="px-4 py-2 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
          >
            Seguir editando
          </button>
          <button
            onClick={() => blocker.proceed()}
            className="px-4 py-2 rounded-lg bg-[#dc2626] text-white text-sm hover:bg-[#b91c1c] transition-colors"
          >
            Salir sin guardar
          </button>
        </div>
      </div>
    </Modal>
  );
}
