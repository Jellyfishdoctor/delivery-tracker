import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  HIGH: { label: "High", className: "bg-red-900/50 text-red-400 hover:bg-red-900/50" },
  MEDIUM: { label: "Medium", className: "bg-amber-900/50 text-amber-400 hover:bg-amber-900/50" },
  LOW: { label: "Low", className: "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/50" },
};

interface PriorityBadgeProps {
  priority: keyof typeof priorityConfig;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("font-medium border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
