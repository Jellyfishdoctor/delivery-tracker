"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, GripVertical, Pencil, Trash2, User, X, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface Subtask {
  id: string;
  title: string;
  assignee: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onUpdate: (id: string, data: { title?: string; assignee?: string | null; dueDate?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

export function SubtaskItem({
  subtask,
  onToggle,
  onUpdate,
  onDelete,
  isDragging,
  dragHandleProps,
}: SubtaskItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const [editAssignee, setEditAssignee] = useState(subtask.assignee || "");
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    subtask.dueDate ? new Date(subtask.dueDate) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true);
    await onToggle(subtask.id, checked);
    setIsUpdating(false);
  };

  const handleSave = async () => {
    if (!editTitle.trim()) return;

    setIsUpdating(true);
    await onUpdate(subtask.id, {
      title: editTitle.trim(),
      assignee: editAssignee.trim() || null,
      dueDate: editDueDate ? editDueDate.toISOString() : null,
    });
    setIsEditing(false);
    setIsUpdating(false);
  };

  const handleCancel = () => {
    setEditTitle(subtask.title);
    setEditAssignee(subtask.assignee || "");
    setEditDueDate(subtask.dueDate ? new Date(subtask.dueDate) : undefined);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsUpdating(true);
    await onDelete(subtask.id);
  };

  const isOverdue =
    subtask.dueDate && !subtask.completed && new Date(subtask.dueDate) < new Date();

  if (isEditing) {
    return (
      <div className={cn(
        "flex flex-col gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700",
        isDragging && "opacity-50"
      )}>
        <div className="flex items-center gap-2">
          <Input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Subtask title"
            className="flex-1"
            autoFocus
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 flex-1">
            <User className="h-4 w-4 text-slate-500" />
            <Input
              value={editAssignee}
              onChange={(e) => setEditAssignee(e.target.value)}
              placeholder="Assignee"
              className="w-32"
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-32 justify-start text-left font-normal">
                  {editDueDate ? format(editDueDate, "MMM d, yyyy") : "Due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={editDueDate}
                  onSelect={(date) => {
                    setEditDueDate(date);
                    setIsCalendarOpen(false);
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {editDueDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditDueDate(undefined)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isUpdating}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isUpdating || !editTitle.trim()}>
            <Check className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 group p-2 rounded-lg hover:bg-slate-800/30 transition-colors",
        isDragging && "opacity-50 bg-slate-800/50"
      )}
    >
      <div
        {...dragHandleProps}
        className="mt-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4 text-slate-500" />
      </div>
      <Checkbox
        checked={subtask.completed}
        onCheckedChange={handleToggle}
        disabled={isUpdating}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            subtask.completed && "line-through text-slate-500"
          )}
        >
          {subtask.title}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          {subtask.assignee && (
            <>
              <User className="h-3 w-3" />
              <span>{subtask.assignee}</span>
            </>
          )}
          {subtask.assignee && subtask.dueDate && <span>&bull;</span>}
          {subtask.dueDate && (
            <span className={cn(isOverdue && "text-red-400")}>
              Due: {format(new Date(subtask.dueDate), "MMM d")}
              {isOverdue && " (Overdue)"}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-7 w-7 p-0"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isUpdating}
          className="h-7 w-7 p-0 text-red-400 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
