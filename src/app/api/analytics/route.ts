import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addWeeks, subMonths, format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const product = searchParams.get("product");
    const accountManagerId = searchParams.get("accountManagerId");

    const where: Record<string, unknown> = {};
    if (product) where.product = product;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

    // Total projects
    const totalProjects = await prisma.project.count({ where });

    // In progress
    const inProgress = await prisma.project.count({
      where: { ...where, status: "IN_PROGRESS" },
    });

    // Completed this month
    const completedThisMonth = await prisma.project.count({
      where: {
        ...where,
        status: "COMPLETED",
        updatedAt: { gte: thisMonthStart, lte: thisMonthEnd },
      },
    });

    // Overdue
    const overdue = await prisma.project.count({
      where: {
        ...where,
        targetDate: { lt: now },
        status: { notIn: ["COMPLETED"] },
      },
    });

    // By Stage
    const byStage = await prisma.project.groupBy({
      by: ["stage"],
      where,
      _count: true,
    });

    // By Product
    const byProduct = await prisma.project.groupBy({
      by: ["product"],
      where,
      _count: true,
    });

    // By Priority
    const byPriority = await prisma.project.groupBy({
      by: ["priority"],
      where,
      _count: true,
    });

    // By Status
    const byStatus = await prisma.project.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Account Manager Workload (active projects)
    const workload = await prisma.project.groupBy({
      by: ["accountManagerId"],
      where: {
        ...where,
        status: { notIn: ["COMPLETED"] },
      },
      _count: true,
    });

    const accountManagers = await prisma.user.findMany({
      where: { id: { in: workload.map((w) => w.accountManagerId) } },
      select: { id: true, name: true },
    });

    const byAccountManager = workload.map((w) => ({
      name: accountManagers.find((a) => a.id === w.accountManagerId)?.name || "Unknown",
      active: w._count,
    }));

    // Monthly trend (last 6 months)
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const created = await prisma.project.count({
        where: {
          ...where,
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      });

      const completed = await prisma.project.count({
        where: {
          ...where,
          status: "COMPLETED",
          updatedAt: { gte: monthStart, lte: monthEnd },
        },
      });

      monthlyTrend.push({
        month: format(monthStart, "MMM yyyy"),
        created,
        completed,
      });
    }

    // Due this week
    const dueThisWeek = await prisma.project.findMany({
      where: {
        ...where,
        targetDate: { gte: thisWeekStart, lte: thisWeekEnd },
        status: { notIn: ["COMPLETED"] },
      },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        accountName: true,
      },
      orderBy: { targetDate: "asc" },
    });

    // Due next week
    const dueNextWeek = await prisma.project.findMany({
      where: {
        ...where,
        targetDate: { gte: nextWeekStart, lte: nextWeekEnd },
        status: { notIn: ["COMPLETED"] },
      },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        accountName: true,
      },
      orderBy: { targetDate: "asc" },
    });

    // Overdue projects
    const overdueProjects = await prisma.project.findMany({
      where: {
        ...where,
        targetDate: { lt: now },
        status: { notIn: ["COMPLETED"] },
      },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        accountName: true,
      },
      orderBy: { targetDate: "asc" },
    });

    const priorityColors: Record<string, string> = {
      HIGH: "#EF4444",
      MEDIUM: "#F59E0B",
      LOW: "#22C55E",
    };

    return NextResponse.json({
      totalProjects,
      inProgress,
      completedThisMonth,
      overdue,
      byStage: byStage.map((s) => ({ name: s.stage, value: s._count })),
      byProduct: byProduct.map((p) => ({
        name: p.product === "AI_AGENT" ? "AI Agent" : "Analytics",
        value: p._count,
      })),
      byPriority: byPriority.map((p) => ({
        name: p.priority,
        value: p._count,
        fill: priorityColors[p.priority],
      })),
      byStatus: byStatus.map((s) => ({
        name: s.status.replace(/_/g, " "),
        value: s._count,
      })),
      byAccountManager,
      monthlyTrend,
      dueThisWeek,
      dueNextWeek,
      overdueProjects,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
