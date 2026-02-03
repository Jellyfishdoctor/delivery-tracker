"use client";

import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Clock, CheckSquare } from "lucide-react";

interface UseCaseChipProps {
  id: string;
  useCaseSummary: string;
  stage: string;
  status: string;
  priority: string;
  targetDate: string | Date;
  customerEngineer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  pendingActionItems?: number;
  subtaskProgress?: { completed: number; total: number } | null;
  onClick?: () => void;
}

const stageLabels: Record<string, string> = {
  POC: "POC",
  ONBOARDING: "ONBOARD",
  PRODUCTION: "PROD",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Done",
  BLOCKED: "BLOCKED",
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "text-slate-400",
  IN_PROGRESS: "text-blue-400",
  ON_HOLD: "text-amber-400",
  COMPLETED: "text-emerald-400",
  BLOCKED: "text-red-400",
};

export function UseCaseChip({
  useCaseSummary,
  stage,
  status,
  priority,
  targetDate,
  customerEngineer,
  pendingActionItems = 0,
  subtaskProgress,
  onClick,
}: UseCaseChipProps) {
  const target = new Date(targetDate);
  const isOverdue = status !== "COMPLETED" && target < new Date();
  const isBlocked = status === "BLOCKED";

  const truncatedSummary =
    useCaseSummary.length > 25
      ? useCaseSummary.substring(0, 25) + "..."
      : useCaseSummary;

  const ceName = customerEngineer?.name?.split(" ")[0] || "-";

  const getDateDisplay = (): string => {
    if (isOverdue) {
      return "Overdue";
    }
    return formatDistanceToNow(target, { addSuffix: false });
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "border rounded-md p-3 cursor-pointer transition-all hover:border-primary/50",
        "bg-slate-900/50 border-slate-700",
        isBlocked && "border-red-500/50",
        isOverdue && !isBlocked && "border-orange-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm text-slate-200 leading-tight">
          {truncatedSummary}
        </h4>
        {(isBlocked || isOverdue) && (
          <AlertTriangle
            className={cn(
              "h-4 w-4 flex-shrink-0",
              isBlocked ? "text-red-400" : "text-orange-400"
            )}
          />
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs">
        <span className="text-slate-400">{stageLabels[stage] || stage}</span>
        <span className="text-slate-600">&bull;</span>
        <span className={statusColors[status] || "text-slate-400"}>
          {statusLabels[status] || status}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-300">CE: {ceName}</span>
        <div className="flex items-center gap-1 text-slate-400">
          <Clock className="h-3 w-3" />
          <span className={isOverdue ? "text-red-400" : "text-slate-400"}>
            {getDateDisplay()}
          </span>
        </div>
      </div>

      {subtaskProgress && subtaskProgress.total > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{
                width: `${Math.round((subtaskProgress.completed / subtaskProgress.total) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <CheckSquare className="h-3 w-3" />
            <span>{subtaskProgress.completed}/{subtaskProgress.total}</span>
          </div>
        </div>
      )}

      {pendingActionItems > 0 && (
        <div className="mt-2 text-xs text-amber-400">
          {pendingActionItems} pending action{pendingActionItems > 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
