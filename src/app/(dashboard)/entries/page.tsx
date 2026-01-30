"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StageBadge } from "@/components/shared/StageBadge";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { useToast } from "@/components/ui/use-toast";
import { cn, getJiraUrl, isOverdue } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface Project {
  id: string;
  accountManagerId: string;
  accountManager: { id: string; name: string | null; email: string };
  accountNameId: string;
  accountName: { id: string; name: string };
  stage: "POC" | "ONBOARDING" | "PRODUCTION";
  product: "ANALYTICS" | "AI_AGENT";
  spoc: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  useCaseSummary: string;
  targetDate: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "BLOCKED";
  jiraTicket: string | null;
  createdAt: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function EntriesPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    stage: "",
    product: "",
    priority: "",
    status: "",
    accountManagerId: "",
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchUsers();
  }, []);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.stage) params.set("stage", filters.stage);
      if (filters.product) params.set("product", filters.product);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.status) params.set("status", filters.status);
      if (filters.accountManagerId) params.set("accountManagerId", filters.accountManagerId);
      if (search) params.set("search", search);

      const response = await fetch(`/api/projects?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(debounce);
  }, [search, filters]);

  const handleDelete = async () => {
    if (!deleteProject) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${deleteProject.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast({ title: "Success", description: "Project deleted successfully" });
        fetchProjects();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProject(null);
    }
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.stage) params.set("stage", filters.stage);
    if (filters.product) params.set("product", filters.product);
    if (filters.priority) params.set("priority", filters.priority);
    if (filters.status) params.set("status", filters.status);
    if (filters.accountManagerId) params.set("accountManagerId", filters.accountManagerId);

    window.open(`/api/projects/export?${params.toString()}`, "_blank");
  };

  const clearFilters = () => {
    setFilters({
      stage: "",
      product: "",
      priority: "",
      status: "",
      accountManagerId: "",
    });
    setSearch("");
  };

  const paginatedProjects = projects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const totalPages = Math.ceil(projects.length / rowsPerPage);

  const getRowClassName = (project: Project) => {
    if (project.status === "COMPLETED") return "bg-green-50";
    if (project.status === "BLOCKED") return "bg-gray-50";
    if (isOverdue(project.targetDate, project.status)) return "bg-red-50";
    return "";
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Entries</h1>
          <p className="text-slate-500">View and manage all project entries</p>
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by account name, SPOC, or use case..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Select
                value={filters.stage}
                onValueChange={(value) => setFilters({ ...filters, stage: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Stage" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  <SelectItem value="ANALYTICS">Analytics</SelectItem>
                  <SelectItem value="AI_AGENT">AI Agent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
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

              <Select
                value={filters.accountManagerId}
                onValueChange={(value) => setFilters({ ...filters, accountManagerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Account Manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Managers</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Name</TableHead>
                  <TableHead>Account Manager</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>SPOC</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Target Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Jira</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginatedProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProjects.map((project) => (
                    <TableRow key={project.id} className={getRowClassName(project)}>
                      <TableCell className="font-medium">{project.accountName.name}</TableCell>
                      <TableCell>{project.accountManager.name || project.accountManager.email}</TableCell>
                      <TableCell><StageBadge stage={project.stage} /></TableCell>
                      <TableCell>{project.product === "AI_AGENT" ? "AI Agent" : "Analytics"}</TableCell>
                      <TableCell>{project.spoc}</TableCell>
                      <TableCell><PriorityBadge priority={project.priority} /></TableCell>
                      <TableCell>
                        <span className={cn(
                          isOverdue(project.targetDate, project.status) && "text-red-600 font-medium"
                        )}>
                          {format(new Date(project.targetDate), "MMM d, yyyy")}
                          {isOverdue(project.targetDate, project.status) && (
                            <span className="block text-xs">Overdue</span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell><StatusBadge status={project.status} /></TableCell>
                      <TableCell>
                        {project.jiraTicket && (
                          <a
                            href={getJiraUrl(project.jiraTicket)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            {project.jiraTicket.length > 15
                              ? project.jiraTicket.slice(0, 15) + "..."
                              : project.jiraTicket}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(project.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditProject(project)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteProject(project)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Rows per page:</span>
              <Select
                value={String(rowsPerPage)}
                onValueChange={(value) => {
                  setRowsPerPage(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {(page - 1) * rowsPerPage + 1}-{Math.min(page * rowsPerPage, projects.length)} of{" "}
                {projects.length}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editProject} onOpenChange={() => setEditProject(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Update the project details below
            </DialogDescription>
          </DialogHeader>
          {editProject && (
            <ProjectForm
              mode="edit"
              initialData={{
                id: editProject.id,
                accountManagerId: editProject.accountManagerId,
                accountNameId: editProject.accountNameId,
                stage: editProject.stage,
                product: editProject.product,
                spoc: editProject.spoc,
                priority: editProject.priority,
                useCaseSummary: editProject.useCaseSummary,
                targetDate: new Date(editProject.targetDate),
                status: editProject.status,
                jiraTicket: editProject.jiraTicket || "",
              }}
              onSuccess={() => {
                setEditProject(null);
                fetchProjects();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the project for{" "}
              <strong>{deleteProject?.accountName.name}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteProject(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
