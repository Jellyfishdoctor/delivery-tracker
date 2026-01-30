import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;

    if (dateFrom || dateTo) {
      where.timestamp = {};
      if (dateFrom) (where.timestamp as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.timestamp as Record<string, unknown>).lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { fieldName: { contains: search } },
        { oldValue: { contains: search } },
        { newValue: { contains: search } },
      ];
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      include: {
        project: {
          include: {
            accountName: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(auditLogs);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
