import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateHealthScore } from "@/lib/health";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const product = searchParams.get("product");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    // Build project filter
    const projectWhere: Record<string, unknown> = {};
    if (stage) projectWhere.stage = stage;
    if (product) projectWhere.product = { contains: product };
    if (status) projectWhere.status = status;

    // Get all account names with their projects
    const accountNames = await prisma.accountName.findMany({
      where: search
        ? {
            name: { contains: search },
          }
        : undefined,
      include: {
        projects: {
          where: Object.keys(projectWhere).length > 0 ? projectWhere : undefined,
          include: {
            accountManager: {
              select: { id: true, name: true, email: true },
            },
            customerEngineer: {
              select: { id: true, name: true, email: true },
            },
            meetingNotes: {
              orderBy: { meetingDate: "desc" },
              take: 1,
              select: {
                meetingDate: true,
              },
            },
            _count: {
              select: {
                meetingNotes: true,
              },
            },
          },
          orderBy: { updatedAt: "desc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Filter out accounts with no projects (after filtering)
    const accountsWithProjects = accountNames.filter(
      (account) => account.projects.length > 0
    );

    // Calculate health for each account and format response
    const aggregatedAccounts = accountsWithProjects.map((account) => {
      const health = calculateHealthScore(
        account.projects.map((p) => ({
          status: p.status,
          priority: p.priority,
          targetDate: p.targetDate,
          updatedAt: p.updatedAt,
        }))
      );

      // Get the primary account manager (from first project)
      const primaryAM = account.projects[0]?.accountManager;

      // Get pending action items count across all projects
      // (We'll add this later when we have action items)

      return {
        id: account.id,
        name: account.name,
        projectCount: account.projects.length,
        health,
        accountManager: primaryAM,
        projects: account.projects.map((project) => ({
          id: project.id,
          useCaseSummary: project.useCaseSummary,
          stage: project.stage,
          status: project.status,
          priority: project.priority,
          targetDate: project.targetDate,
          customerEngineer: project.customerEngineer,
          product: project.product,
          channels: project.channels,
          jiraTicket: project.jiraTicket,
          spoc: project.spoc,
          lastDiscussed: project.meetingNotes[0]?.meetingDate || null,
          meetingNotesCount: project._count.meetingNotes,
        })),
      };
    });

    // Sort by health score (worst first to prioritize attention)
    aggregatedAccounts.sort((a, b) => a.health.score - b.health.score);

    return NextResponse.json(aggregatedAccounts);
  } catch (error) {
    console.error("Error fetching aggregated accounts:", error);
    return NextResponse.json(
      { error: "Failed to fetch aggregated accounts" },
      { status: 500 }
    );
  }
}
