"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Calendar, User } from "lucide-react";
import { ActionItemCheckbox } from "./ActionItemCheckbox";
import { cn } from "@/lib/utils";

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
  dueDate?: string | Date | null;
}

interface MeetingNoteCardProps {
  id: string;
  meetingDate: string | Date;
  notes: string;
  attendees?: string | null;
  createdBy: {
    id: string;
    name: string | null;
    email: string;
  };
  actionItems: ActionItem[];
  onEdit?: () => void;
  onDelete?: () => void;
  onActionItemStatusChange: (actionItemId: string, status: string) => void;
}

export function MeetingNoteCard({
  id,
  meetingDate,
  notes,
  attendees,
  createdBy,
  actionItems,
  onEdit,
  onDelete,
  onActionItemStatusChange,
}: MeetingNoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsedAttendees: string[] = attendees
    ? JSON.parse(attendees)
    : [];

  const completedCount = actionItems.filter(
    (item) => item.status === "COMPLETED"
  ).length;

  const date = new Date(meetingDate);
  const formattedDate = format(date, "MMM d, yyyy");
  const timeAgo = formatDistanceToNow(date, { addSuffix: true });

  // Truncate notes for preview
  const shouldTruncate = notes.length > 200;
  const displayNotes = isExpanded || !shouldTruncate
    ? notes
    : notes.substring(0, 200) + "...";

  return (
    <Card className="bg-slate-900/50 border-slate-800">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="font-medium text-slate-200">{formattedDate}</span>
            <span className="text-slate-500">({timeAgo})</span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={onDelete}
                className="text-red-400 focus:text-red-400"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {parsedAttendees.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <User className="h-3 w-3" />
            <span>Attendees: {parsedAttendees.join(", ")}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-2">
        <div className="text-sm text-slate-300 whitespace-pre-wrap">
          {displayNotes}
        </div>

        {shouldTruncate && (
          <Button
            variant="link"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-0 text-primary h-auto py-1"
          >
            {isExpanded ? "Show less" : "Show more"}
          </Button>
        )}

        {actionItems.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-400">
                Action Items
              </h4>
              <span className="text-xs text-slate-500">
                {completedCount}/{actionItems.length} completed
              </span>
            </div>
            <div className="space-y-3">
              {actionItems.map((item) => (
                <ActionItemCheckbox
                  key={item.id}
                  id={item.id}
                  description={item.description}
                  status={item.status}
                  assigneeName={item.assigneeName || item.assignee?.name || item.assignee?.email || null}
                  dueDate={item.dueDate}
                  onStatusChange={onActionItemStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-800">
          <span className="text-xs text-slate-500">
            Added by {createdBy.name || createdBy.email}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
