import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get("stage");
    const product = searchParams.get("product");
    const priority = searchParams.get("priority");
    const status = searchParams.get("status");
    const accountManagerId = searchParams.get("accountManagerId");

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (product) where.product = product;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    const projects = await prisma.project.findMany({
      where,
      include: {
        accountManager: { select: { name: true, email: true } },
        accountName: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Generate CSV
    const headers = [
      "Account Name",
      "Account Manager",
      "Stage",
      "Product",
      "SPOC",
      "Priority",
      "Use Case Summary",
      "Target Date",
      "Status",
      "Jira Ticket",
      "Created At",
    ];

    const rows = projects.map((p) => [
      p.accountName.name,
      p.accountManager.name || p.accountManager.email,
      p.stage,
      p.product,
      p.spoc,
      p.priority,
      `"${p.useCaseSummary.replace(/"/g, '""')}"`,
      format(new Date(p.targetDate), "yyyy-MM-dd"),
      p.status,
      p.jiraTicket || "",
      format(new Date(p.createdAt), "yyyy-MM-dd HH:mm:ss"),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="projects-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting projects:", error);
    return NextResponse.json(
      { error: "Failed to export projects" },
      { status: 500 }
    );
  }
}
