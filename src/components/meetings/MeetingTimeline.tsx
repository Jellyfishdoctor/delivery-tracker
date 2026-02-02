"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Calendar, MessageSquare } from "lucide-react";
import { MeetingNoteCard } from "./MeetingNoteCard";
import { MeetingNoteEditor } from "./MeetingNoteEditor";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActionItem {
  id: string;
  description: string;
  status: string;
  assigneeName?: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  dueDate?: string | null;
}

interface MeetingNote {
  id: string;
  meetingDate: string;
  notes: string;
  attendees: string | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  actionItems: ActionItem[];
}

interface MeetingTimelineProps {
  projectId: string;
}

export function MeetingTimeline({ projectId }: MeetingTimelineProps) {
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingNote | null>(null);
  const [deletingMeeting, setDeletingMeeting] = useState<MeetingNote | null>(null);
  const { toast } = useToast();

  const fetchMeetings = async () => {
    try {
      const response = await fetch(`/api/meetings?projectId=${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMeetings(data);
      }
    } catch (error) {
      console.error("Error fetching meetings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [projectId]);

  const handleSave = async (data: {
    meetingDate: Date;
    notes: string;
    attendees: string[];
    actionItems: Array<{
      description: string;
      assigneeName: string;
      dueDate: Date | null;
    }>;
  }) => {
    try {
      const payload = {
        projectId,
        meetingDate: data.meetingDate.toISOString(),
        notes: data.notes,
        attendees: data.attendees,
        actionItems: data.actionItems.map((item) => ({
          description: item.description,
          assigneeName: item.assigneeName || null,
          dueDate: item.dueDate?.toISOString() || null,
        })),
      };

      if (editingMeeting) {
        const response = await fetch(`/api/meetings/${editingMeeting.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to update");

        toast({ title: "Success", description: "Meeting note updated" });
      } else {
        const response = await fetch("/api/meetings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Failed to create");

        toast({ title: "Success", description: "Meeting note added" });
      }

      setShowEditor(false);
      setEditingMeeting(null);
      fetchMeetings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save meeting note",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingMeeting) return;

    try {
      const response = await fetch(`/api/meetings/${deletingMeeting.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      toast({ title: "Success", description: "Meeting note deleted" });
      setDeletingMeeting(null);
      fetchMeetings();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete meeting note",
        variant: "destructive",
      });
    }
  };

  const handleActionItemStatusChange = async (
    actionItemId: string,
    status: string
  ) => {
    try {
      const response = await fetch(`/api/action-items/${actionItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) throw new Error("Failed to update");

      // Update local state
      setMeetings((prev) =>
        prev.map((meeting) => ({
          ...meeting,
          actionItems: meeting.actionItems.map((item) =>
            item.id === actionItemId ? { ...item, status } : item
          ),
        }))
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update action item",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48 bg-slate-800" />
        <Skeleton className="h-40 w-full bg-slate-800" />
        <Skeleton className="h-40 w-full bg-slate-800" />
      </div>
    );
  }

  const lastDiscussed = meetings[0]?.meetingDate
    ? formatDistanceToNow(new Date(meetings[0].meetingDate), { addSuffix: true })
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <MessageSquare className="h-4 w-4" />
            <span>{meetings.length} meeting note{meetings.length !== 1 ? "s" : ""}</span>
          </div>
          {lastDiscussed && (
            <>
              <span className="text-slate-600">&bull;</span>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>Last discussed {lastDiscussed}</span>
              </div>
            </>
          )}
        </div>
        <Button size="sm" onClick={() => setShowEditor(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Add Note
        </Button>
      </div>

      {/* Meeting List */}
      {meetings.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No meeting notes yet</p>
          <p className="text-sm mt-1">Add your first meeting note to track discussions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting) => (
            <MeetingNoteCard
              key={meeting.id}
              id={meeting.id}
              meetingDate={meeting.meetingDate}
              notes={meeting.notes}
              attendees={meeting.attendees}
              createdBy={meeting.createdBy}
              actionItems={meeting.actionItems}
              onEdit={() => {
                setEditingMeeting(meeting);
                setShowEditor(true);
              }}
              onDelete={() => setDeletingMeeting(meeting)}
              onActionItemStatusChange={handleActionItemStatusChange}
            />
          ))}
        </div>
      )}

      {/* Editor Dialog */}
      <Dialog
        open={showEditor}
        onOpenChange={(open) => {
          if (!open) {
            setShowEditor(false);
            setEditingMeeting(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMeeting ? "Edit Meeting Note" : "Add Meeting Note"}
            </DialogTitle>
            <DialogDescription>
              Record discussion points and action items from your meeting
            </DialogDescription>
          </DialogHeader>
          <MeetingNoteEditor
            key={editingMeeting?.id || "new"}
            projectId={projectId}
            initialData={
              editingMeeting
                ? {
                    id: editingMeeting.id,
                    meetingDate: new Date(editingMeeting.meetingDate),
                    notes: editingMeeting.notes,
                    attendees: editingMeeting.attendees
                      ? JSON.parse(editingMeeting.attendees)
                      : [],
                    actionItems: editingMeeting.actionItems.map((item) => ({
                      id: item.id,
                      description: item.description,
                      assigneeName: item.assigneeName || item.assignee?.name || item.assignee?.email || "",
                      dueDate: item.dueDate ? new Date(item.dueDate) : null,
                    })),
                  }
                : undefined
            }
            onSave={handleSave}
            onCancel={() => {
              setShowEditor(false);
              setEditingMeeting(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deletingMeeting}
        onOpenChange={() => setDeletingMeeting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this meeting note? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
