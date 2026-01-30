import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const priorityConfig = {
  HIGH: { label: "High", className: "bg-red-50 text-red-700 hover:bg-red-50" },
  MEDIUM: { label: "Medium", className: "bg-amber-50 text-amber-700 hover:bg-amber-50" },
  LOW: { label: "Low", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" },
};

interface PriorityBadgeProps {
  priority: keyof typeof priorityConfig;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
