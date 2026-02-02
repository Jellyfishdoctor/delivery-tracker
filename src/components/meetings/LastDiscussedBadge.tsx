"use client";

import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Calendar, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface LastDiscussedBadgeProps {
  date: string | Date | null;
  warningThreshold?: number; // Days after which to show warning
}

export function LastDiscussedBadge({
  date,
  warningThreshold = 14,
}: LastDiscussedBadgeProps) {
  if (!date) {
    return (
      <span className="text-sm text-slate-500 flex items-center gap-1">
        <Calendar className="h-3 w-3" />
        Never discussed
      </span>
    );
  }

  const parsedDate = new Date(date);
  const daysAgo = differenceInDays(new Date(), parsedDate);
  const timeAgo = formatDistanceToNow(parsedDate, { addSuffix: true });

  const isStale = daysAgo > warningThreshold;

  return (
    <span
      className={cn(
        "text-sm flex items-center gap-1",
        isStale ? "text-orange-400" : "text-slate-400"
      )}
    >
      {isStale ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <Calendar className="h-3 w-3" />
      )}
      {timeAgo}
    </span>
  );
}
