interface BadgeProps {
  children: React.ReactNode;
  variant?: "success" | "warning" | "danger" | "info" | "neutral";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const variants = {
    success: "bg-[#d1fae5] text-[#065f46]",
    warning: "bg-[#fef3c7] text-[#92400e]",
    danger: "bg-[#fee2e2] text-[#991b1b]",
    info: "bg-[#dbeafe] text-[#1e40af]",
    neutral: "bg-[#f1f5f9] text-[#475569]",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${variants[variant]}`}>
      {children}
    </span>
  );
}
