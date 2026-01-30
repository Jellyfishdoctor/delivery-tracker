import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const stageConfig = {
  POC: { label: "POC", className: "bg-purple-50 text-purple-700 hover:bg-purple-50" },
  ONBOARDING: { label: "Onboarding", className: "bg-blue-50 text-blue-700 hover:bg-blue-50" },
  PRODUCTION: { label: "Production", className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" },
};

interface StageBadgeProps {
  stage: keyof typeof stageConfig;
}

export function StageBadge({ stage }: StageBadgeProps) {
  const config = stageConfig[stage];
  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
