"use client";

import { AccountCard } from "./AccountCard";
import { HealthResult } from "@/lib/health";
import { Skeleton } from "@/components/ui/skeleton";

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
}

interface AggregatedAccount {
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
}

interface AccountGridProps {
  accounts: AggregatedAccount[];
  isLoading?: boolean;
  onProjectClick?: (project: Project) => void;
}

export function AccountGrid({ accounts, isLoading, onProjectClick }: AccountGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <AccountGridSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p className="text-lg">No accounts found</p>
        <p className="text-sm mt-1">Try adjusting your filters or add new entries</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {accounts.map((account) => (
        <AccountCard
          key={account.id}
          id={account.id}
          name={account.name}
          projectCount={account.projectCount}
          health={account.health}
          accountManager={account.accountManager}
          projects={account.projects}
          onProjectClick={onProjectClick}
        />
      ))}
    </div>
  );
}

function AccountGridSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-md bg-slate-800" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32 bg-slate-800" />
          <Skeleton className="h-4 w-24 bg-slate-800" />
        </div>
      </div>
      <Skeleton className="h-4 w-40 bg-slate-800 mb-4" />
      <div className="space-y-2">
        <Skeleton className="h-20 w-full bg-slate-800" />
        <Skeleton className="h-20 w-full bg-slate-800" />
      </div>
    </div>
  );
}
