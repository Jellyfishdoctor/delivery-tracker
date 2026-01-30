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
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        project: {
          include: { accountName: true },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    // Generate CSV
    const headers = [
      "Timestamp",
      "User",
      "Project",
      "Action",
      "Field Changed",
      "Old Value",
      "New Value",
    ];

    const rows = auditLogs.map((log) => [
      format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
      log.userName,
      log.project?.accountName?.name || "Deleted Project",
      log.action,
      log.fieldName || "",
      `"${(log.oldValue || "").replace(/"/g, '""')}"`,
      `"${(log.newValue || "").replace(/"/g, '""')}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting audit logs:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs" },
      { status: 500 }
    );
  }
}
