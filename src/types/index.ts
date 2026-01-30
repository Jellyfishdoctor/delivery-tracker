import { User, Project, AuditLog, AccountName } from "@prisma/client";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

// Project with relations
export interface ProjectWithRelations extends Project {
  accountManager: User;
  accountName: AccountName;
}

// Audit log with relations
export interface AuditLogWithRelations extends AuditLog {
  project: Project & {
    accountName: AccountName;
  };
}

// Form types
export interface ProjectFormData {
  accountManagerId: string;
  accountNameId: string;
  accountNameNew?: string;
  stage: "POC" | "ONBOARDING" | "PRODUCTION";
  product: "ANALYTICS" | "AI_AGENT";
  spoc: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  useCaseSummary: string;
  targetDate: Date;
  status: "NOT_STARTED" | "IN_PROGRESS" | "ON_HOLD" | "COMPLETED" | "BLOCKED";
  jiraTicket?: string;
}

// Filter types
export interface ProjectFilters {
  stage?: string;
  product?: string;
  priority?: string;
  status?: string;
  accountManagerId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Analytics types
export interface AnalyticsData {
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
  dueThisWeek: ProjectWithRelations[];
  dueNextWeek: ProjectWithRelations[];
  overdueProjects: ProjectWithRelations[];
}
