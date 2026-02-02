"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, User } from "lucide-react";
import { CapacityBar } from "./CapacityBar";
import { cn } from "@/lib/utils";

interface ProjectInfo {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
}

interface CEWorkloadCardProps {
  name: string;
  email: string;
  projectCount: number;
  capacity: number;
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

export function CEWorkloadCard({
  name,
  email,
  projectCount,
  capacity,
  projects,
  onProjectClick,
}: CEWorkloadCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxVisibleProjects = 3;
  const visibleProjects = isExpanded ? projects : projects.slice(0, maxVisibleProjects);
  const hiddenCount = projects.length - maxVisibleProjects;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-slate-800">
            <User className="h-5 w-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-black truncate">{name}</h3>
            {email && (
              <p className="text-xs text-slate-500 truncate">{email}</p>
            )}
          </div>
        </div>

        <div className="mt-3">
          <CapacityBar capacity={capacity} projectCount={projectCount} />
        </div>
      </CardHeader>

      {projects.length > 0 && (
        <CardContent className="pt-0">
          <div className="space-y-2">
            {visibleProjects.map((project) => (
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

          {hiddenCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-slate-400 hover:text-slate-200"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  +{hiddenCount} more
                </>
              )}
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}
