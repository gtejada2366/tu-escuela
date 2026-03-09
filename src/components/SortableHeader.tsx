import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc" | null;

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentDirection: SortDirection;
  onSort: (key: string) => void;
  className?: string;
  align?: "left" | "center";
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  className = "",
  align = "left",
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      className={`px-6 py-3 text-xs uppercase tracking-wider cursor-pointer select-none hover:bg-[#eef2f7] transition-colors ${
        align === "center" ? "text-center" : "text-left"
      } ${isActive ? "text-[#2563eb]" : "text-[#64748b]"} ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`inline-flex items-center gap-1 ${align === "center" ? "justify-center" : ""}`}>
        <span>{label}</span>
        {isActive && currentDirection === "asc" ? (
          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
        ) : isActive && currentDirection === "desc" ? (
          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-40 shrink-0" />
        )}
      </div>
    </th>
  );
}

export function sortData<T>(data: T[], key: string | null, direction: SortDirection): T[] {
  if (!key || !direction) return data;

  return [...data].sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[key];
    const bVal = (b as Record<string, unknown>)[key];

    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let comparison: number;
    if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal), "es");
    }

    return direction === "asc" ? comparison : -comparison;
  });
}

export function getNextSort(
  key: string,
  currentKey: string | null,
  currentDirection: SortDirection
): { key: string | null; direction: SortDirection } {
  if (currentKey !== key) return { key, direction: "asc" };
  if (currentDirection === "asc") return { key, direction: "desc" };
  return { key: null, direction: null };
}
