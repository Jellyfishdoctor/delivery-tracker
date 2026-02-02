import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusConfig = {
  NOT_STARTED: { label: "Not Started", className: "bg-slate-800 text-slate-400 hover:bg-slate-800" },
  IN_PROGRESS: { label: "In Progress", className: "bg-blue-900/50 text-blue-400 hover:bg-blue-900/50" },
  ON_HOLD: { label: "On Hold", className: "bg-amber-900/50 text-amber-400 hover:bg-amber-900/50" },
  COMPLETED: { label: "Completed", className: "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/50" },
  BLOCKED: { label: "Blocked", className: "bg-red-900/50 text-red-400 hover:bg-red-900/50" },
};

interface StatusBadgeProps {
  status: keyof typeof statusConfig;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("font-medium border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
