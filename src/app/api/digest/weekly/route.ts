import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfWeek, endOfWeek, addDays, format, differenceInDays } from "date-fns";
import { calculateHealthScore } from "@/lib/health";

interface AccountHealth {
  id: string;
  name: string;
  projectCount: number;
  healthScore: number;
  healthStatus: string;
}

interface DigestProject {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
  targetDate: Date;
  customerEngineer: string | null;
  daysBlocked?: number;
  daysOverdue?: number;
}

interface WeeklyDigest {
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const formatType = searchParams.get("format");
    const weekParam = searchParams.get("week"); // Optional: ISO date string

    // Calculate week boundaries
    const referenceDate = weekParam ? new Date(weekParam) : new Date();
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 }); // Sunday
    const nextWeekEnd = addDays(weekEnd, 7);
    const now = new Date();

    // Fetch all projects with their account names
    const projects = await prisma.project.findMany({
      include: {
        accountName: true,
        customerEngineer: {
          select: { name: true, email: true },
        },
        auditLogs: {
          where: {
            timestamp: {
              gte: weekStart,
              lte: weekEnd,
            },
          },
          select: {
            action: true,
            fieldName: true,
            oldValue: true,
            newValue: true,
            timestamp: true,
          },
        },
      },
    });

    // Calculate summary stats
    const activeProjects = projects.filter((p) => p.status !== "COMPLETED");
    const blockedProjects = projects.filter((p) => p.status === "BLOCKED");
    const overdueProjects = activeProjects.filter(
      (p) => new Date(p.targetDate) < now
    );

    // Projects completed this week (status changed to COMPLETED during this week)
    const completedThisWeek = projects.filter((p) => {
      if (p.status !== "COMPLETED") return false;
      // Check if status changed to COMPLETED this week
      const statusChangeLog = p.auditLogs.find(
        (log) => log.fieldName === "Status" && log.newValue === "COMPLETED"
      );
      return statusChangeLog !== undefined;
    });

    // New projects created this week
    const newThisWeek = projects.filter(
      (p) => new Date(p.createdAt) >= weekStart && new Date(p.createdAt) <= weekEnd
    );

    // On-track rate: projects not blocked and not overdue
    const onTrackProjects = activeProjects.filter(
      (p) => p.status !== "BLOCKED" && new Date(p.targetDate) >= now
    );
    const onTrackRate =
      activeProjects.length > 0
        ? Math.round((onTrackProjects.length / activeProjects.length) * 100)
        : 100;

    // Upcoming projects (target date within next 7 days from week end)
    const upcomingProjects = activeProjects.filter((p) => {
      const targetDate = new Date(p.targetDate);
      return targetDate > weekEnd && targetDate <= nextWeekEnd;
    });

    // Build attention needed list (blocked + overdue)
    const attentionProjects: DigestProject[] = [];

    blockedProjects.forEach((p) => {
      // Find when it became blocked
      const blockedLog = p.auditLogs.find(
        (log) => log.fieldName === "Status" && log.newValue === "BLOCKED"
      );
      const blockedSince = blockedLog
        ? new Date(blockedLog.timestamp)
        : new Date(p.updatedAt);
      const daysBlocked = differenceInDays(now, blockedSince);

      attentionProjects.push({
        id: p.id,
        accountName: p.accountName.name,
        useCaseSummary: p.useCaseSummary,
        stage: p.stage,
        status: p.status,
        targetDate: p.targetDate,
        customerEngineer: p.customerEngineer?.name || p.customerEngineer?.email || null,
        daysBlocked,
      });
    });

    overdueProjects
      .filter((p) => p.status !== "BLOCKED") // Don't double-count blocked projects
      .forEach((p) => {
        const daysOverdue = differenceInDays(now, new Date(p.targetDate));
        attentionProjects.push({
          id: p.id,
          accountName: p.accountName.name,
          useCaseSummary: p.useCaseSummary,
          stage: p.stage,
          status: p.status,
          targetDate: p.targetDate,
          customerEngineer: p.customerEngineer?.name || p.customerEngineer?.email || null,
          daysOverdue,
        });
      });

    // Sort attention projects by severity (more days blocked/overdue first)
    attentionProjects.sort((a, b) => {
      const aValue = (a.daysBlocked || 0) + (a.daysOverdue || 0);
      const bValue = (b.daysBlocked || 0) + (b.daysOverdue || 0);
      return bValue - aValue;
    });

    // Build account health summary
    const accountMap = new Map<string, typeof projects>();
    projects.forEach((p) => {
      const accountId = p.accountName.id;
      if (!accountMap.has(accountId)) {
        accountMap.set(accountId, []);
      }
      accountMap.get(accountId)!.push(p);
    });

    const byAccount: AccountHealth[] = [];
    accountMap.forEach((accountProjects, accountId) => {
      const health = calculateHealthScore(
        accountProjects.map((p) => ({
          status: p.status,
          priority: p.priority,
          targetDate: p.targetDate,
          updatedAt: p.updatedAt,
          stage: p.stage,
        }))
      );

      byAccount.push({
        id: accountId,
        name: accountProjects[0].accountName.name,
        projectCount: accountProjects.length,
        healthScore: health.score,
        healthStatus: health.status,
      });
    });

    // Sort accounts by health (worst first)
    byAccount.sort((a, b) => a.healthScore - b.healthScore);

    const digest: WeeklyDigest = {
      weekStart: format(weekStart, "yyyy-MM-dd"),
      weekEnd: format(weekEnd, "yyyy-MM-dd"),
      summary: {
        totalActive: activeProjects.length,
        completedThisWeek: completedThisWeek.length,
        newThisWeek: newThisWeek.length,
        blocked: blockedProjects.length,
        overdue: overdueProjects.length,
        onTrackRate,
      },
      completed: completedThisWeek.map((p) => ({
        id: p.id,
        accountName: p.accountName.name,
        useCaseSummary: p.useCaseSummary,
        stage: p.stage,
        status: p.status,
        targetDate: p.targetDate,
        customerEngineer: p.customerEngineer?.name || p.customerEngineer?.email || null,
      })),
      attention: attentionProjects,
      upcoming: upcomingProjects.map((p) => ({
        id: p.id,
        accountName: p.accountName.name,
        useCaseSummary: p.useCaseSummary,
        stage: p.stage,
        status: p.status,
        targetDate: p.targetDate,
        customerEngineer: p.customerEngineer?.name || p.customerEngineer?.email || null,
      })),
      byAccount,
    };

    // If markdown format requested, convert to markdown
    if (formatType === "markdown") {
      const markdown = generateMarkdown(digest);
      return new NextResponse(markdown, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }

    return NextResponse.json(digest);
  } catch (error) {
    console.error("Error generating weekly digest:", error);
    return NextResponse.json(
      { error: "Failed to generate weekly digest" },
      { status: 500 }
    );
  }
}

function generateMarkdown(digest: WeeklyDigest): string {
  const weekRange = `${format(new Date(digest.weekStart), "MMM d")} - ${format(new Date(digest.weekEnd), "MMM d, yyyy")}`;

  let md = `# DELIVERY STATUS - Week of ${weekRange}\n\n`;

  // Summary
  md += `## SUMMARY\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Active Projects | ${digest.summary.totalActive} |\n`;
  md += `| Completed This Week | ${digest.summary.completedThisWeek} |\n`;
  md += `| New Projects | ${digest.summary.newThisWeek} |\n`;
  md += `| Currently Blocked | ${digest.summary.blocked} |\n`;
  md += `| Overdue | ${digest.summary.overdue} |\n`;
  md += `| On-Track Rate | ${digest.summary.onTrackRate}% |\n\n`;

  // Completed
  if (digest.completed.length > 0) {
    md += `## COMPLETED THIS WEEK\n\n`;
    digest.completed.forEach((p) => {
      md += `- ✓ **${p.accountName}** - ${p.useCaseSummary} (${formatStage(p.stage)})\n`;
    });
    md += `\n`;
  }

  // Attention
  if (digest.attention.length > 0) {
    md += `## ATTENTION NEEDED\n\n`;
    digest.attention.forEach((p) => {
      if (p.daysBlocked !== undefined) {
        md += `- ⚠️ **${p.accountName}** - ${p.useCaseSummary} - BLOCKED (${p.daysBlocked} days)\n`;
      } else if (p.daysOverdue !== undefined) {
        md += `- ⚠️ **${p.accountName}** - ${p.useCaseSummary} - OVERDUE (${p.daysOverdue} days)\n`;
      }
    });
    md += `\n`;
  }

  // Upcoming
  if (digest.upcoming.length > 0) {
    md += `## UPCOMING THIS WEEK\n\n`;
    digest.upcoming.forEach((p) => {
      md += `- ${format(new Date(p.targetDate), "MMM d")}: **${p.accountName}** - ${p.useCaseSummary}\n`;
    });
    md += `\n`;
  }

  // By Account
  md += `## BY ACCOUNT\n\n`;
  digest.byAccount.forEach((a) => {
    const healthIndicator = getHealthIndicator(a.healthStatus);
    md += `- **${a.name}** (${a.projectCount} projects) ${healthIndicator} ${a.healthStatus}\n`;
  });

  return md;
}

function formatStage(stage: string): string {
  const labels: Record<string, string> = {
    POC: "POC",
    ONBOARDING: "Onboarding",
    PRODUCTION: "Production",
  };
  return labels[stage] || stage;
}

function getHealthIndicator(status: string): string {
  const indicators: Record<string, string> = {
    Good: "●●●●●",
    Fair: "●●●○○",
    "At Risk": "●●○○○",
    Critical: "●○○○○",
  };
  return indicators[status] || "○○○○○";
}
