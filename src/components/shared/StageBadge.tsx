import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stageConfig = {
  POC: { label: "POC", className: "bg-purple-900/50 text-purple-400 hover:bg-purple-900/50" },
  ONBOARDING: { label: "Onboarding", className: "bg-blue-900/50 text-blue-400 hover:bg-blue-900/50" },
  PRODUCTION: { label: "Production", className: "bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/50" },
};

interface StageBadgeProps {
  stage: keyof typeof stageConfig;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const config = stageConfig[stage];
  return (
    <Badge variant="outline" className={cn("font-medium border-0", config.className)}>
      {config.label}
    </Badge>
  );
}
