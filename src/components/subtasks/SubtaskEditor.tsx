"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, User, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface SubtaskEditorProps {
  onAdd: (data: { title: string; assignee?: string; dueDate?: string }) => Promise<void>;
}

export function SubtaskEditor({ onAdd }: SubtaskEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;

    setIsSubmitting(true);
    await onAdd({
      title: title.trim(),
      assignee: assignee.trim() || undefined,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
    });

    setTitle("");
    setAssignee("");
    setDueDate(undefined);
    setIsAdding(false);
    setIsSubmitting(false);
  };

  const handleCancel = () => {
    setTitle("");
    setAssignee("");
    setDueDate(undefined);
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsAdding(true)}
        className="w-full justify-start text-slate-400 hover:text-slate-300"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Subtask
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs to be done?"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) {
            handleSubmit();
          } else if (e.key === "Escape") {
            handleCancel();
          }
        }}
      />
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-slate-500" />
          <Input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Assignee"
            className="w-32"
          />
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-32 justify-start text-left font-normal">
                {dueDate ? format(dueDate, "MMM d, yyyy") : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dueDate}
                onSelect={(date) => {
                  setDueDate(date);
                  setIsCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {dueDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDueDate(undefined)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={isSubmitting || !title.trim()}>
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>
    </div>
  );
}
