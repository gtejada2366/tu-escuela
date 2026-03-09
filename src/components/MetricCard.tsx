import type { LucideProps } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<LucideProps>;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
}

export function MetricCard({ title, value, icon: Icon, change, changeType = "neutral" }: MetricCardProps) {
  const changeColors = {
    positive: "text-[#10b981]",
    negative: "text-[#dc2626]",
    neutral: "text-[#64748b]",
  };

  return (
    <div className="bg-white rounded-lg p-6 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-lg bg-[#eff6ff]">
          <Icon className="w-6 h-6 text-[#2563eb]" />
        </div>
        {change && (
          <span className={`text-sm ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      <h3 className="text-sm text-[#64748b] mb-1">{title}</h3>
      <p className="text-2xl text-[#1e293b]">{value}</p>
    </div>
  );
}
