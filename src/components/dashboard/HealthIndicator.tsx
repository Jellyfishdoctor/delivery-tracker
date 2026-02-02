"use client";

import { cn } from "@/lib/utils";
import { HealthStatus, getHealthColor } from "@/lib/health";

interface HealthIndicatorProps {
  score: number;
  status: HealthStatus;
  showLabel?: boolean;
}

export function HealthIndicator({ score, status, showLabel = true }: HealthIndicatorProps) {
  // Map score to filled dots (1-5)
  const getFilledDots = (score: number): number => {
    if (score <= 20) return 1;
    if (score <= 40) return 2;
    if (score <= 60) return 3;
    if (score <= 80) return 4;
    return 5;
  };

  const filledDots = getFilledDots(score);
  const statusColor = getHealthColor(status);

  const getDotColor = (index: number, filled: boolean): string => {
    if (!filled) return "bg-slate-600";

    switch (status) {
      case "Critical":
        return "bg-red-500";
      case "At Risk":
        return "bg-orange-500";
      case "Fair":
        return "bg-yellow-500";
      case "Good":
        return "bg-green-500";
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              getDotColor(dot, dot <= filledDots)
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn("text-sm font-medium", statusColor)}>
          {status}
        </span>
      )}
    </div>
  );
}
