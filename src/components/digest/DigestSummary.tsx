"use client";

interface DigestSummaryProps {
  totalActive: number;
  completedThisWeek: number;
  newThisWeek: number;
  blocked: number;
  overdue: number;
  onTrackRate: number;
}

export function DigestSummary({
  totalActive,
  completedThisWeek,
  newThisWeek,
  blocked,
  overdue,
  onTrackRate,
}: DigestSummaryProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <SummaryItem label="Total Active" value={totalActive} />
      <SummaryItem label="Completed" value={completedThisWeek} variant="success" />
      <SummaryItem label="New" value={newThisWeek} variant="info" />
      <SummaryItem label="Blocked" value={blocked} variant="danger" />
      <SummaryItem label="Overdue" value={overdue} variant="warning" />
      <SummaryItem label="On-Track" value={`${onTrackRate}%`} variant={onTrackRate >= 80 ? "success" : onTrackRate >= 50 ? "warning" : "danger"} />
    </div>
  );
}

function SummaryItem({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number | string;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const colorClasses = {
    default: "text-slate-100",
    success: "text-emerald-400",
    warning: "text-amber-400",
    danger: "text-red-400",
    info: "text-blue-400",
  };

  return (
    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
      <div className={`text-2xl font-bold ${colorClasses[variant]}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
