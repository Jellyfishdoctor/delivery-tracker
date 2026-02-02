"use client";

import { useState, useEffect, useCallback } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DigestSummary } from "./DigestSummary";
import { DigestSection } from "./DigestSection";
import { DigestAccountList } from "./DigestAccountList";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface DigestProject {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
  targetDate: string;
  customerEngineer: string | null;
  daysBlocked?: number;
  daysOverdue?: number;
}

interface AccountHealth {
  id: string;
  name: string;
  projectCount: number;
  healthScore: number;
  healthStatus: string;
}

interface WeeklyDigestData {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalActive: number;
    completedThisWeek: number;
    newThisWeek: number;
    blocked: number;
    overdue: number;
    onTrackRate: number;
  };
  completed: DigestProject[];
  attention: DigestProject[];
  upcoming: DigestProject[];
  byAccount: AccountHealth[];
}

export function WeeklyDigest() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [digest, setDigest] = useState<WeeklyDigestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });

  const fetchDigest = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/digest/weekly?week=${format(selectedDate, "yyyy-MM-dd")}`
      );
      if (!response.ok) throw new Error("Failed to fetch digest");
      const data = await response.json();
      setDigest(data);
    } catch (error) {
      console.error("Error fetching digest:", error);
      toast({ title: "Error", description: "Failed to load weekly digest", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate, toast]);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  const handlePreviousWeek = () => {
    setSelectedDate(subWeeks(selectedDate, 1));
  };

  const handleNextWeek = () => {
    setSelectedDate(addWeeks(selectedDate, 1));
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(
        `/api/digest/weekly?week=${format(selectedDate, "yyyy-MM-dd")}&format=markdown`
      );
      if (!response.ok) throw new Error("Failed to fetch markdown");
      const markdown = await response.text();
      await navigator.clipboard.writeText(markdown);
      setIsCopied(true);
      toast({ title: "Success", description: "Copied to clipboard" });
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({ title: "Error", description: "Failed to copy to clipboard", variant: "destructive" });
    }
  };

  const formatStage = (stage: string): string => {
    const labels: Record<string, string> = {
      POC: "POC",
      ONBOARDING: "Onboarding",
      PRODUCTION: "Production",
    };
    return labels[stage] || stage;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-3 cursor-pointer">
                <CardTitle className="text-lg font-semibold text-slate-100">
                  Weekly Digest
                </CardTitle>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 text-slate-400 transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
              </div>
            </CollapsibleTrigger>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePreviousWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      if (date) {
                        setSelectedDate(date);
                        setIsCalendarOpen(false);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleNextWeek}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={fetchDigest}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {isLoading ? (
              <DigestSkeleton />
            ) : digest ? (
              <>
                <DigestSummary {...digest.summary} />

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Completed This Week */}
                  <DigestSection
                    title="Completed This Week"
                    icon={<CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                  >
                    {digest.completed.length > 0 ? (
                      <div className="space-y-2">
                        {digest.completed.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="text-slate-200">
                                {project.accountName}
                              </span>
                              <span className="text-slate-500"> - </span>
                              <span className="text-slate-400">
                                {project.useCaseSummary}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No completions this week
                      </div>
                    )}
                  </DigestSection>

                  {/* Attention Needed */}
                  <DigestSection
                    title="Attention Needed"
                    icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                  >
                    {digest.attention.length > 0 ? (
                      <div className="space-y-2">
                        {digest.attention.map((project) => (
                          <div
                            key={project.id}
                            className="flex items-start gap-2 text-sm"
                          >
                            <AlertTriangle
                              className={cn(
                                "h-4 w-4 mt-0.5 flex-shrink-0",
                                project.daysBlocked !== undefined
                                  ? "text-red-400"
                                  : "text-amber-400"
                              )}
                            />
                            <div>
                              <span className="text-slate-200">
                                {project.accountName}
                              </span>
                              <span className="text-slate-500"> - </span>
                              <span className="text-slate-400">
                                {project.useCaseSummary}
                              </span>
                              <span
                                className={cn(
                                  "ml-2 text-xs font-medium",
                                  project.daysBlocked !== undefined
                                    ? "text-red-400"
                                    : "text-amber-400"
                                )}
                              >
                                {project.daysBlocked !== undefined
                                  ? `BLOCKED (${project.daysBlocked}d)`
                                  : `OVERDUE (${project.daysOverdue}d)`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">
                        No items need attention
                      </div>
                    )}
                  </DigestSection>
                </div>

                {/* Upcoming This Week */}
                <DigestSection
                  title="Upcoming This Week"
                  icon={<Clock className="h-4 w-4 text-blue-400" />}
                >
                  {digest.upcoming.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-2">
                      {digest.upcoming.map((project) => (
                        <div
                          key={project.id}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span className="text-blue-400 font-medium min-w-[60px]">
                            {format(new Date(project.targetDate), "MMM d")}:
                          </span>
                          <div>
                            <span className="text-slate-200">
                              {project.accountName}
                            </span>
                            <span className="text-slate-500"> - </span>
                            <span className="text-slate-400">
                              {project.useCaseSummary}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No upcoming deadlines
                    </div>
                  )}
                </DigestSection>

                {/* By Account */}
                <DigestSection
                  title="By Account"
                  icon={<Building2 className="h-4 w-4 text-slate-400" />}
                >
                  <DigestAccountList accounts={digest.byAccount} />
                </DigestSection>

                {/* Copy Button */}
                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyToClipboard}
                    className="gap-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy to Clipboard
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-slate-400">
                Failed to load digest
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function DigestSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 bg-slate-800" />
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-32 bg-slate-800" />
        <Skeleton className="h-32 bg-slate-800" />
      </div>
      <Skeleton className="h-24 bg-slate-800" />
    </div>
  );
}
