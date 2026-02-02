"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectInfo {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
}

interface UnassignedProjectsProps {
  projects: ProjectInfo[];
  onProjectClick?: (projectId: string) => void;
}

const stageLabels: Record<string, string> = {
  POC: "POC",
  ONBOARDING: "Onboarding",
  PRODUCTION: "Production",
};

const statusColors: Record<string, string> = {
  NOT_STARTED: "text-slate-400",
  IN_PROGRESS: "text-blue-400",
  ON_HOLD: "text-amber-400",
  COMPLETED: "text-emerald-400",
  BLOCKED: "text-red-400",
};

const statusLabels: Record<string, string> = {
  NOT_STARTED: "Not Started",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};

export function UnassignedProjects({ projects, onProjectClick }: UnassignedProjectsProps) {
  if (projects.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-slate-300 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Unassigned
          <span className="text-sm font-normal text-slate-500">
            ({projects.length} {projects.length === 1 ? "project needs" : "projects need"} CE assignment)
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick?.(project.id)}
              className={cn(
                "flex items-center justify-between p-2 rounded-lg bg-slate-800/50",
                onProjectClick && "cursor-pointer hover:bg-slate-800"
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-300 truncate">
                    {project.accountName}
                  </span>
                  <span className="text-xs text-slate-500">
                    {stageLabels[project.stage] || project.stage}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {project.useCaseSummary}
                </p>
              </div>
              <span className={cn("text-xs font-medium ml-2", statusColors[project.status])}>
                {statusLabels[project.status] || project.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
