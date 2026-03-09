export function LoadingSpinner({ message = "Cargando datos..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-[#2563eb] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-sm text-[#64748b]">{message}</p>
    </div>
  );
}
