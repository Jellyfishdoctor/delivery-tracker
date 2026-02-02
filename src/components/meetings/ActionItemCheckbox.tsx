"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface ActionItemCheckboxProps {
  id: string;
  description: string;
  status: string;
  assigneeName?: string | null;
  dueDate?: string | Date | null;
  onStatusChange: (id: string, status: string) => void;
}

export function ActionItemCheckbox({
  id,
  description,
  status,
  assigneeName,
  dueDate,
  onStatusChange,
}: ActionItemCheckboxProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const isCompleted = status === "COMPLETED";

  const handleChange = async (checked: boolean) => {
    setIsUpdating(true);
    await onStatusChange(id, checked ? "COMPLETED" : "PENDING");
    setIsUpdating(false);
  };

  const isOverdue =
    dueDate && !isCompleted && new Date(dueDate) < new Date();

  return (
    <div className="flex items-start gap-3 group">
      <Checkbox
        checked={isCompleted}
        onCheckedChange={handleChange}
        disabled={isUpdating}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            isCompleted && "line-through text-slate-500"
          )}
        >
          {description}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          {assigneeName && (
            <span>{assigneeName}</span>
          )}
          {assigneeName && dueDate && <span>&bull;</span>}
          {dueDate && (
            <span className={cn(isOverdue && "text-red-400")}>
              Due: {format(new Date(dueDate), "MMM d")}
              {isOverdue && " (Overdue)"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
