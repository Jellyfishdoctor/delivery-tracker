"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionItemInput {
  id?: string;
  description: string;
  assigneeName: string;
  dueDate: Date | null;
}

interface MeetingNoteEditorProps {
  projectId: string;
  initialData?: {
    id: string;
    meetingDate: Date;
    notes: string;
    attendees: string[];
    actionItems: ActionItemInput[];
  };
  onSave: (data: {
    meetingDate: Date;
    notes: string;
    attendees: string[];
    actionItems: ActionItemInput[];
  }) => Promise<void>;
  onCancel: () => void;
}

export function MeetingNoteEditor({
  projectId,
  initialData,
  onSave,
  onCancel,
}: MeetingNoteEditorProps) {
  const [meetingDate, setMeetingDate] = useState<Date>(
    initialData?.meetingDate || new Date()
  );
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [attendees, setAttendees] = useState<string[]>(
    initialData?.attendees || []
  );
  const [attendeeInput, setAttendeeInput] = useState("");
  const [actionItems, setActionItems] = useState<ActionItemInput[]>(
    initialData?.actionItems || []
  );
  const [isSaving, setIsSaving] = useState(false);

  // Update state when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setMeetingDate(initialData.meetingDate);
      setNotes(initialData.notes);
      setAttendees(initialData.attendees);
      setActionItems(initialData.actionItems);
    } else {
      setMeetingDate(new Date());
      setNotes("");
      setAttendees([]);
      setActionItems([]);
    }
  }, [initialData]);


  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !attendees.includes(attendeeInput.trim())) {
      setAttendees([...attendees, attendeeInput.trim()]);
      setAttendeeInput("");
    }
  };

  const handleRemoveAttendee = (name: string) => {
    setAttendees(attendees.filter((a) => a !== name));
  };

  const handleAddActionItem = () => {
    setActionItems([
      ...actionItems,
      { description: "", assigneeName: "", dueDate: null },
    ]);
  };

  const handleUpdateActionItem = (
    index: number,
    field: keyof ActionItemInput,
    value: string | Date | null
  ) => {
    const updated = [...actionItems];
    updated[index] = { ...updated[index], [field]: value };
    setActionItems(updated);
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!notes.trim()) return;

    setIsSaving(true);
    try {
      await onSave({
        meetingDate,
        notes,
        attendees,
        actionItems: actionItems.filter((item) => item.description.trim()),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Meeting Date */}
      <div className="space-y-2">
        <Label>Meeting Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className={cn(
                "w-full justify-start text-left font-normal",
                !meetingDate && "text-muted-foreground"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {meetingDate ? format(meetingDate, "PPP") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 z-[200]"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <Calendar
              mode="single"
              selected={meetingDate}
              onSelect={(date) => {
                if (date) {
                  setMeetingDate(date);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          placeholder="Meeting discussion notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
          className="resize-none"
        />
      </div>

      {/* Attendees */}
      <div className="space-y-2">
        <Label>Attendees</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Add attendee name"
            value={attendeeInput}
            onChange={(e) => setAttendeeInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddAttendee();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={handleAddAttendee}>
            Add
          </Button>
        </div>
        {attendees.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {attendees.map((attendee) => (
              <div
                key={attendee}
                className="flex items-center gap-1 px-2 py-1 bg-slate-800 rounded-md text-sm"
              >
                <span>{attendee}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttendee(attendee)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Items */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Action Items</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleAddActionItem}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        <div className="space-y-3">
          {actionItems.map((item, index) => (
            <div
              key={index}
              className="p-3 border border-slate-700 rounded-md space-y-3"
            >
              <div className="flex items-start gap-2">
                <Input
                  placeholder="Action item description"
                  value={item.description}
                  onChange={(e) =>
                    handleUpdateActionItem(index, "description", e.target.value)
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveActionItem(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-slate-500">Assigned to</Label>
                  <Input
                    placeholder="Enter name"
                    value={item.assigneeName}
                    onChange={(e) =>
                      handleUpdateActionItem(index, "assigneeName", e.target.value)
                    }
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-500">Due Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        type="button"
                        className={cn(
                          "w-full h-8 justify-start text-left font-normal",
                          !item.dueDate && "text-muted-foreground"
                        )}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {item.dueDate
                          ? format(item.dueDate, "MMM d")
                          : "Set date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 z-[200]"
                      align="start"
                      onOpenAutoFocus={(e) => e.preventDefault()}
                    >
                      <Calendar
                        mode="single"
                        selected={item.dueDate || undefined}
                        onSelect={(date) =>
                          handleUpdateActionItem(index, "dueDate", date || null)
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={!notes.trim() || isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? "Update" : "Add Meeting Note"}
        </Button>
      </div>
    </div>
  );
}
