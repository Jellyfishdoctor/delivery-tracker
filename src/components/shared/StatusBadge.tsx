import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  NOT_STARTED: { label: "Not Started", className: "bg-slate-100 text-slate-700 hover:bg-slate-100" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-50 text-blue-700 hover:bg-blue-50" },
  ON_HOLD: { label: "On Hold", className: "bg-amber-50 text-amber-700 hover:bg-amber-50" },
  COMPLETED: { label: "Completed", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" },
  BLOCKED: { label: "Blocked", className: "bg-red-50 text-red-700 hover:bg-red-50" },
};

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
