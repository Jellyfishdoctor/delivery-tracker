"use client";

import { cn } from "@/lib/utils";

interface CapacityBarProps {
  capacity: number; // 0-100 percentage
  projectCount: number;
  maxCapacity?: number;
}

export function CapacityBar({ capacity, projectCount, maxCapacity = 6 }: CapacityBarProps) {
  const getCapacityColor = () => {
    if (capacity >= 100) return "bg-red-500";
    if (capacity >= 80) return "bg-amber-500";
    if (capacity >= 50) return "bg-blue-500";
    return "bg-emerald-500";
  };

  const getCapacityLabel = () => {
    if (capacity >= 100) return "Over capacity";
    if (capacity >= 80) return "Near capacity";
    return `${capacity}% capacity`;
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", getCapacityColor())}
            style={{ width: `${Math.min(capacity, 100)}%` }}
          />
        </div>
        <span className="text-xs text-slate-400 min-w-[100px] text-right">
          {projectCount} projects ({getCapacityLabel()})
        </span>
      </div>
    </div>
  );
}
