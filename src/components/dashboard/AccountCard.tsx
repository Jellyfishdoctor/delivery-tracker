"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { HealthIndicator } from "./HealthIndicator";
import { UseCaseChip } from "./UseCaseChip";
import { HealthResult } from "@/lib/health";

interface Project {
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
  product: string;
  channels: string | null;
  jiraTicket: string | null;
  spoc: string;
  lastDiscussed: string | null;
  meetingNotesCount: number;
  subtaskProgress?: { completed: number; total: number } | null;
}

interface AccountCardProps {
  id: string;
  name: string;
  projectCount: number;
  health: HealthResult;
  accountManager?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  initialExpanded?: boolean;
  maxVisibleProjects?: number;
}

export function AccountCard({
  name,
  projectCount,
  health,
  accountManager,
  projects,
  onProjectClick,
  initialExpanded = false,
  maxVisibleProjects = 3,
}: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const visibleProjects = isExpanded
    ? projects
    : projects.slice(0, maxVisibleProjects);
  const hiddenCount = projects.length - maxVisibleProjects;
  const showExpandButton = projects.length > maxVisibleProjects;

  return (
    <Card className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-slate-800">
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                {name}
                <span className="text-sm font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                  {projectCount}
                </span>
              </h3>
              {accountManager && (
                <p className="text-sm text-slate-500 mt-0.5">
                  AM: {accountManager.name || accountManager.email}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm text-slate-500">Health:</span>
          <HealthIndicator score={health.score} status={health.status} />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {projects.length === 0 ? (
          <div className="text-sm text-slate-500 py-4 text-center">
            No use cases found
          </div>
        ) : (
          <div className="space-y-2">
            {visibleProjects.map((project) => (
              <UseCaseChip
                key={project.id}
                id={project.id}
                useCaseSummary={project.useCaseSummary}
                stage={project.stage}
                status={project.status}
                priority={project.priority}
                targetDate={project.targetDate}
                customerEngineer={project.customerEngineer}
                subtaskProgress={project.subtaskProgress}
                onClick={() => onProjectClick?.(project)}
              />
            ))}
          </div>
        )}

        {showExpandButton && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3 text-slate-400 hover:text-slate-200"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Collapse
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
    </Card>
  );
}
