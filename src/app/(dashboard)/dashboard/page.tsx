"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search,
  Filter,
  PlusCircle,
  Upload,
  Calendar,
  User,
  ExternalLink,
  Building2,
  MessageSquare,
  Clock,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AccountGrid } from "@/components/dashboard";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StageBadge } from "@/components/shared/StageBadge";
import { MeetingTimeline } from "@/components/meetings";
import { useToast } from "@/components/ui/use-toast";
import { HealthResult } from "@/lib/health";
import { cn, getJiraUrl } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  useCaseSummary: string;
  stage: string;
  status: string;
  priority: string;
  targetDate: string | Date;
  customerEngineer?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  product: string;
  channels: string | null;
  jiraTicket: string | null;
  spoc: string;
  lastDiscussed: string | null;
  meetingNotesCount: number;
}

interface AggregatedAccount {
  id: string;
  name: string;
  projectCount: number;
  health: HealthResult;
  accountManager?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  projects: Project[];
}

interface FullProjectData {
  id: string;
  useCaseSummary: string;
  stage: string;
  status: string;
  priority: string;
  targetDate: string;
  product: string;
  channels: string | null;
  jiraTicket: string | null;
  spoc: string;
  accountManager: { id: string; name: string | null; email: string };
  customerEngineer: { id: string; name: string | null; email: string } | null;
  accountName: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<AggregatedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    stage: "",
    product: "",
    status: "",
  });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedAccountName, setSelectedAccountName] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.stage && filters.stage !== "all") params.set("stage", filters.stage);
      if (filters.product && filters.product !== "all") params.set("product", filters.product);
      if (filters.status && filters.status !== "all") params.set("status", filters.status);
      if (search) params.set("search", search);

      const response = await fetch(`/api/accounts/aggregated?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAccounts(data);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast({
        title: "Error",
        description: "Failed to fetch accounts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchAccounts();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, filters]);

  const clearFilters = () => {
    setFilters({
      stage: "",
      product: "",
      status: "",
    });
    setSearch("");
  };

  const handleProjectClick = (project: Project, accountName: string) => {
    setSelectedProject(project);
    setSelectedAccountName(accountName);
  };

  // Calculate summary stats
  const totalAccounts = accounts.length;
  const atRiskAccounts = accounts.filter(
    (a) => a.health.status === "At Risk"
  ).length;
  const criticalAccounts = accounts.filter(
    (a) => a.health.status === "Critical"
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Dashboard</h1>
          <p className="text-slate-400">Account-centric view of all deliveries</p>
        </div>
        <div className="flex gap-2">
          <Link href="/new-entry">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
          <Link href="/import">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-slate-100">{totalAccounts}</div>
            <div className="text-sm text-slate-400">Total Accounts</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-orange-500">{atRiskAccounts}</div>
            <div className="text-sm text-slate-400">At Risk</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-500">{criticalAccounts}</div>
            <div className="text-sm text-slate-400">Critical</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by account name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-slate-800 border-slate-700"
                />
              </div>
              <Button variant="outline" onClick={clearFilters} className="border-slate-700">
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Select
                value={filters.stage}
                onValueChange={(value) => setFilters({ ...filters, stage: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Stages</SelectItem>
                  <SelectItem value="POC">POC</SelectItem>
                  <SelectItem value="ONBOARDING">Onboarding</SelectItem>
                  <SelectItem value="PRODUCTION">Production</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.product}
                onValueChange={(value) => setFilters({ ...filters, product: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="ANALYTICS">Analytics</SelectItem>
                  <SelectItem value="AI_AGENT">AI Agent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="BLOCKED">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Grid */}
      <AccountGrid
        accounts={accounts}
        isLoading={isLoading}
        onProjectClick={(project) => {
          const account = accounts.find((a) =>
            a.projects.some((p) => p.id === project.id)
          );
          if (account) {
            handleProjectClick(project, account.name);
          }
        }}
      />

      {/* Quick View Dialog */}
      <Dialog open={!!selectedProject} onOpenChange={() => setSelectedProject(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl">{selectedProject?.useCaseSummary}</DialogTitle>
              <Link href={`/entries?search=${encodeURIComponent(selectedProject?.useCaseSummary || '')}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Building2 className="h-4 w-4" />
              <span>{selectedAccountName}</span>
            </div>
          </DialogHeader>

          {selectedProject && (
            <QuickViewContent project={selectedProject} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quick View Content Component
function QuickViewContent({ project }: { project: Project }) {
  const [fullProject, setFullProject] = useState<FullProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}`);
        if (response.ok) {
          const data = await response.json();
          setFullProject(data);
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProject();
  }, [project.id]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full bg-slate-800" />
        <Skeleton className="h-40 w-full bg-slate-800" />
      </div>
    );
  }

  if (!fullProject) {
    return <div className="py-8 text-center text-slate-400">Failed to load project details</div>;
  }

  const parseProducts = (product: string): string[] => {
    try {
      return JSON.parse(product);
    } catch {
      return [product];
    }
  };

  const parseChannels = (channels: string | null): string[] => {
    if (!channels) return [];
    try {
      return JSON.parse(channels);
    } catch {
      return [];
    }
  };

  const targetDate = new Date(fullProject.targetDate);
  const isOverdue = fullProject.status !== "COMPLETED" && targetDate < new Date();

  return (
    <div className="space-y-6">
      {/* Status Row */}
      <div className="flex flex-wrap items-center gap-3">
        <StageBadge stage={fullProject.stage as "POC" | "ONBOARDING" | "PRODUCTION"} />
        <StatusBadge status={fullProject.status as "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "BLOCKED"} />
        <PriorityBadge priority={fullProject.priority as "HIGH" | "MEDIUM" | "LOW"} />
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <DetailItem
          label="Account Manager"
          value={fullProject.accountManager.name || fullProject.accountManager.email}
          icon={<User className="h-4 w-4" />}
        />
        <DetailItem
          label="Customer Engineer"
          value={fullProject.customerEngineer?.name || fullProject.customerEngineer?.email || "Unassigned"}
          icon={<User className="h-4 w-4" />}
        />
        <DetailItem
          label="SPOC"
          value={fullProject.spoc}
          icon={<User className="h-4 w-4" />}
        />
        <DetailItem
          label="Target Date"
          value={format(targetDate, "MMM d, yyyy")}
          icon={<Calendar className="h-4 w-4" />}
          highlight={isOverdue}
          subtitle={isOverdue ? "Overdue" : undefined}
        />
        <DetailItem
          label="Product"
          value={parseProducts(fullProject.product).map(p => p === "AI_AGENT" ? "AI Agent" : "Analytics").join(", ")}
        />
        <DetailItem
          label="Channels"
          value={parseChannels(fullProject.channels).join(", ") || "N/A"}
        />
      </div>

      {/* Jira Ticket */}
      {fullProject.jiraTicket && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Jira:</span>
          <a
            href={getJiraUrl(fullProject.jiraTicket)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
          >
            {fullProject.jiraTicket}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      <Separator className="bg-slate-800" />

      {/* Meeting Notes Section */}
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Meeting Notes
        </h3>
        <MeetingTimeline projectId={project.id} />
      </div>

      {/* Timestamps */}
      <div className="text-xs text-slate-500 pt-4 border-t border-slate-800">
        <div>Created: {format(new Date(fullProject.createdAt), "MMM d, yyyy 'at' h:mm a")}</div>
        <div>Last updated: {formatDistanceToNow(new Date(fullProject.updatedAt), { addSuffix: true })}</div>
      </div>
    </div>
  );
}

// Detail Item Component
function DetailItem({
  label,
  value,
  icon,
  highlight,
  subtitle,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className={cn("flex items-center gap-2", highlight && "text-red-400")}>
        {icon && <span className="text-slate-500">{icon}</span>}
        <span className="text-sm text-slate-200">{value}</span>
      </div>
      {subtitle && <div className="text-xs text-red-400">{subtitle}</div>}
    </div>
  );
}
