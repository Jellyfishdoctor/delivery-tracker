"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { Briefcase, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

interface AnalyticsData {
  totalProjects: number;
  inProgress: number;
  completedThisMonth: number;
  overdue: number;
  byStage: { name: string; value: number }[];
  byProduct: { name: string; value: number }[];
  byPriority: { name: string; value: number; fill: string }[];
  byStatus: { name: string; value: number }[];
  byAccountManager: { name: string; active: number }[];
  monthlyTrend: { month: string; created: number; completed: number }[];
  dueThisWeek: Project[];
  dueNextWeek: Project[];
  overdueProjects: Project[];
}

interface Project {
  id: string;
  accountName: { name: string };
  accountManager: { name: string | null };
  targetDate: string;
  status: string;
  priority: string;
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

const COLORS = ["#7C3AED", "#3B82F6", "#22C55E", "#F59E0B", "#EF4444"];
const STAGE_COLORS = { POC: "#8B5CF6", ONBOARDING: "#3B82F6", PRODUCTION: "#22C55E" };

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    product: "",
    accountManagerId: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.product) params.set("product", filters.product);
      if (filters.accountManagerId) params.set("accountManagerId", filters.accountManagerId);

      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
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

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Analytics</h1>
          <p className="text-slate-500">Overview of project deliveries</p>
        </div>
        <div className="flex gap-4">
          <Select
            value={filters.product}
            onValueChange={(value) => setFilters({ ...filters, product: value })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Products" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="ANALYTICS">Analytics</SelectItem>
              <SelectItem value="AI_AGENT">AI Agent</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.accountManagerId}
            onValueChange={(value) => setFilters({ ...filters, accountManagerId: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Managers" />
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.totalProjects}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.inProgress}</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{data.completedThisMonth}</p>
                <p className="text-sm text-muted-foreground">Completed This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={data.overdue > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${data.overdue > 0 ? "bg-red-100" : "bg-slate-100"}`}>
                <AlertTriangle className={`h-6 w-6 ${data.overdue > 0 ? "text-red-600" : "text-slate-600"}`} />
              </div>
              <div>
                <p className={`text-2xl font-bold ${data.overdue > 0 ? "text-red-600" : ""}`}>
                  {data.overdue}
                </p>
                <p className="text-sm text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Projects by Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byStage}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.byStage.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STAGE_COLORS[entry.name as keyof typeof STAGE_COLORS] || COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Projects by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projects by Product</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.byProduct}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {data.byProduct.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {data.byPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Account Manager Workload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Manager Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byAccountManager}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="active" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Trend (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="created"
                  stroke="#7C3AED"
                  strokeWidth={2}
                  name="Created"
                />
                <Line
                  type="monotone"
                  dataKey="completed"
                  stroke="#22C55E"
                  strokeWidth={2}
                  name="Completed"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Timeline Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Due This Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Due This Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data.dueThisWeek.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects due this week</p>
            ) : (
              <div className="space-y-3">
                {data.dueThisWeek.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.accountName.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(project.targetDate), "MMM d")}
                      </p>
                    </div>
                    <PriorityBadge priority={project.priority as "HIGH" | "MEDIUM" | "LOW"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Due Next Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Due Next Week</CardTitle>
          </CardHeader>
          <CardContent>
            {data.dueNextWeek.length === 0 ? (
              <p className="text-muted-foreground text-sm">No projects due next week</p>
            ) : (
              <div className="space-y-3">
                {data.dueNextWeek.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.accountName.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(project.targetDate), "MMM d")}
                      </p>
                    </div>
                    <PriorityBadge priority={project.priority as "HIGH" | "MEDIUM" | "LOW"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Overdue Projects */}
        <Card className={data.overdueProjects.length > 0 ? "border-red-200" : ""}>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Overdue Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {data.overdueProjects.length === 0 ? (
              <p className="text-muted-foreground text-sm">No overdue projects</p>
            ) : (
              <div className="space-y-3">
                {data.overdueProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{project.accountName.name}</p>
                      <p className="text-xs text-red-500">
                        Due: {format(new Date(project.targetDate), "MMM d")}
                      </p>
                    </div>
                    <PriorityBadge priority={project.priority as "HIGH" | "MEDIUM" | "LOW"} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
