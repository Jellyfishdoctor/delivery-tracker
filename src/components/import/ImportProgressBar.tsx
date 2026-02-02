"use client";

import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface ImportProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export function ImportProgressBar({
  current,
  total,
  label = "Importing...",
}: ImportProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{label}</span>
        </div>
        <span className="text-slate-500">
          {current} / {total} ({percentage}%)
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
