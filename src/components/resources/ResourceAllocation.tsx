"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CEWorkloadCard } from "./CEWorkloadCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, AlertTriangle, BarChart3, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProjectInfo {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
}

interface EngineerAllocation {
  id: string;
  name: string;
  email: string;
  projectCount: number;
  capacity: number;
  projects: ProjectInfo[];
}

interface ResourceAllocationData {
  engineers: EngineerAllocation[];
  unassigned: ProjectInfo[];
  summary: {
    totalProjects: number;
    assignedProjects: number;
    unassignedProjects: number;
    avgPerCE: number;
    maxCapacity: number;
    ceCompletions: number;
    assignedAccountNames: string[];
    unassignedAccountNames: string[];
  };
}

interface ResourceAllocationProps {
  onProjectClick?: (projectId: string) => void;
}

export function ResourceAllocation({ onProjectClick }: ResourceAllocationProps) {
  const [allocation, setAllocation] = useState<ResourceAllocationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchAllocation = useCallback(async () => {
    try {
      const response = await fetch("/api/resources/allocation");
      if (!response.ok) throw new Error("Failed to fetch allocation");
      const data = await response.json();
      setAllocation(data);
    } catch (error) {
      console.error("Error fetching resource allocation:", error);
      toast({ title: "Error", description: "Failed to load resource allocation", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAllocation();
  }, [fetchAllocation]);

  if (isLoading) {
    return <ResourceAllocationSkeleton />;
  }

  if (!allocation) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-slate-400">
          Failed to load resource allocation
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-black">Resource Allocation</h2>
      </div>

      {/* Summary Stats */}
      <TooltipProvider>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            icon={<Briefcase className="h-5 w-5" />}
            label="Total Projects"
            value={allocation.summary.totalProjects}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SummaryCard
                  icon={<Users className="h-5 w-5" />}
                  label="Assigned"
                  value={allocation.summary.assignedProjects}
                  variant="success"
                />
              </div>
            </TooltipTrigger>
            {allocation.summary.assignedAccountNames && allocation.summary.assignedAccountNames.length > 0 && (
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="font-medium mb-1">Assigned Accounts:</div>
                <div className="text-slate-300">
                  {allocation.summary.assignedAccountNames.slice(0, 10).join(", ")}
                  {allocation.summary.assignedAccountNames.length > 10 &&
                    ` +${allocation.summary.assignedAccountNames.length - 10} more`}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <SummaryCard
                  icon={<AlertTriangle className="h-5 w-5" />}
                  label="Unassigned"
                  value={allocation.summary.unassignedProjects}
                  variant={allocation.summary.unassignedProjects > 0 ? "warning" : "default"}
                />
              </div>
            </TooltipTrigger>
            {allocation.summary.unassignedAccountNames && allocation.summary.unassignedAccountNames.length > 0 && (
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="font-medium mb-1">Unassigned Accounts:</div>
                <div className="text-slate-300">
                  {allocation.summary.unassignedAccountNames.slice(0, 10).join(", ")}
                  {allocation.summary.unassignedAccountNames.length > 10 &&
                    ` +${allocation.summary.unassignedAccountNames.length - 10} more`}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
          <SummaryCard
            icon={<CheckCircle2 className="h-5 w-5" />}
            label="CE Completions"
            value={allocation.summary.ceCompletions}
            variant="success"
          />
          <SummaryCard
            icon={<BarChart3 className="h-5 w-5" />}
            label="Avg per CE"
            value={allocation.summary.avgPerCE}
          />
        </div>
      </TooltipProvider>

      {/* Customer Engineers Grid */}
      <div>
        <h3 className="text-sm font-semibold text-black uppercase tracking-wide mb-4">
          Customer Engineers
        </h3>
        {allocation.engineers.length > 0 ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {allocation.engineers.map((engineer) => (
              <CEWorkloadCard
                key={engineer.id}
                name={engineer.name}
                email={engineer.email}
                projectCount={engineer.projectCount}
                capacity={engineer.capacity}
                projects={engineer.projects}
                onProjectClick={onProjectClick}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-slate-400">
              No customer engineers found
            </CardContent>
          </Card>
        )}
      </div>

      {/* Summary Footer */}
      <div className="text-xs text-slate-500 border-t border-slate-800 pt-4">
        Total: {allocation.summary.totalProjects} projects |
        Assigned: {allocation.summary.assignedProjects} |
        Unassigned: {allocation.summary.unassignedProjects} |
        CE Completions: {allocation.summary.ceCompletions} |
        Max Capacity: {allocation.summary.maxCapacity} per CE
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger";
}) {
  const colorClasses = {
    default: "text-slate-100",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
            {icon}
          </div>
          <div>
            <div className={`text-2xl font-bold ${colorClasses[variant]}`}>
              {value}
            </div>
            <div className="text-xs text-slate-500">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ResourceAllocationSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 bg-slate-800 rounded" />
        <Skeleton className="h-6 w-48 bg-slate-800" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-20 bg-slate-800 rounded-lg" />
        ))}
      </div>

      <div>
        <Skeleton className="h-4 w-32 bg-slate-800 mb-4" />
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 bg-slate-800 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
