"use client";

import { cn } from "@/lib/utils";

interface AccountHealth {
  id: string;
  name: string;
  projectCount: number;
  healthScore: number;
  healthStatus: string;
}

interface DigestAccountListProps {
  accounts: AccountHealth[];
}

export function DigestAccountList({ accounts }: DigestAccountListProps) {
  if (accounts.length === 0) {
    return <div className="text-sm text-slate-500">No accounts</div>;
  }

  return (
    <div className="space-y-2">
      {accounts.map((account) => (
        <div
          key={account.id}
          className="flex items-center justify-between p-2 bg-slate-800/30 rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-200">
              {account.name}
            </span>
            <span className="text-xs text-slate-500">
              ({account.projectCount} {account.projectCount === 1 ? "project" : "projects"})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <HealthDots score={account.healthScore} />
            <span
              className={cn(
                "text-xs font-medium",
                account.healthStatus === "Good" && "text-emerald-400",
                account.healthStatus === "Fair" && "text-blue-400",
                account.healthStatus === "At Risk" && "text-amber-400",
                account.healthStatus === "Critical" && "text-red-400"
              )}
            >
              {account.healthStatus}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function HealthDots({ score }: { score: number }) {
  // Score is 0-100, map to 1-5 dots
  const filledDots = Math.round(score / 20);

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={cn(
            "w-2 h-2 rounded-full",
            i <= filledDots
              ? score >= 80
                ? "bg-emerald-400"
                : score >= 60
                ? "bg-blue-400"
                : score >= 40
                ? "bg-amber-400"
                : "bg-red-400"
              : "bg-slate-700"
          )}
        />
      ))}
    </div>
  );
}
