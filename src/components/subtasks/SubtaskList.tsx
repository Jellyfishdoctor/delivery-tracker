"use client";

import { useState, useEffect, useCallback } from "react";
import { SubtaskItem } from "./SubtaskItem";
import { SubtaskEditor } from "./SubtaskEditor";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";

interface Subtask {
  id: string;
  title: string;
  assignee: string | null;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

interface SubtaskListProps {
  projectId: string;
}

export function SubtaskList({ projectId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubtasks = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/subtasks`);
      if (!response.ok) throw new Error("Failed to fetch subtasks");
      const data = await response.json();
      setSubtasks(data);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
      toast({ title: "Error", description: "Failed to load subtasks", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchSubtasks();
  }, [fetchSubtasks]);

  const handleAdd = async (data: { title: string; assignee?: string; dueDate?: string }) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to create subtask");
      const newSubtask = await response.json();
      setSubtasks((prev) => [...prev, newSubtask]);
      toast({ title: "Success", description: "Subtask added" });
    } catch (error) {
      console.error("Error creating subtask:", error);
      toast({ title: "Error", description: "Failed to add subtask", variant: "destructive" });
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/subtasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });

      if (!response.ok) throw new Error("Failed to update subtask");
      const updated = await response.json();
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast({ title: "Error", description: "Failed to update subtask", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string, data: { title?: string; assignee?: string | null; dueDate?: string | null }) => {
    try {
      const response = await fetch(`/api/subtasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error("Failed to update subtask");
      const updated = await response.json();
      setSubtasks((prev) =>
        prev.map((s) => (s.id === id ? updated : s))
      );
      toast({ title: "Success", description: "Subtask updated" });
    } catch (error) {
      console.error("Error updating subtask:", error);
      toast({ title: "Error", description: "Failed to update subtask", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/subtasks/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete subtask");
      setSubtasks((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "Success", description: "Subtask deleted" });
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast({ title: "Error", description: "Failed to delete subtask", variant: "destructive" });
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-slate-800 rounded animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-slate-300">
              {progressPercent}% ({completedCount}/{totalCount})
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      <div className="space-y-1">
        {subtasks.map((subtask) => (
          <SubtaskItem
            key={subtask.id}
            subtask={subtask}
            onToggle={handleToggle}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <SubtaskEditor onAdd={handleAdd} />
    </div>
  );
}

export function getSubtaskProgress(subtasks: Subtask[]): { completed: number; total: number; percent: number } {
  const completed = subtasks.filter((s) => s.completed).length;
  const total = subtasks.length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}
