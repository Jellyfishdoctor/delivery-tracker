import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProjectSchema = z.object({
  accountManagerId: z.string().nullable().optional(),
  accountManagerName: z.string().nullable().optional(), // Free-form AM name
  accountNameId: z.string().optional(),
  stage: z.enum(["POC", "ONBOARDING", "PRODUCTION"]).optional(),
  product: z.string().optional(), // JSON array string
  channels: z.string().nullable().optional(), // JSON array string
  customerEngineerId: z.string().nullable().optional(),
  customerEngineerName: z.string().nullable().optional(), // Free-form CE name
  spoc: z.string().optional(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
  useCaseSummary: z.string().optional(),
  targetDate: z.string().transform((str) => new Date(str)).optional(),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "BLOCKED"]).optional(),
  jiraTicket: z.string().nullable().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        customerEngineer: { select: { id: true, name: true, email: true } },
        accountName: true,
        auditLogs: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    // Get current project for audit log comparison
    const currentProject = await prisma.project.findUnique({
      where: { id: params.id },
      include: { accountName: true, accountManager: true },
    });

    if (!currentProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create audit logs for changed fields
    const auditLogs: Array<{
      projectId: string;
      userId: string;
      userName: string;
      action: string;
      fieldName: string;
      oldValue: string;
      newValue: string;
    }> = [];

    const fieldLabels: Record<string, string> = {
      accountManagerId: "Account Manager",
      accountManagerName: "Account Manager Name",
      accountNameId: "Account Name",
      stage: "Stage",
      product: "Product",
      channels: "Channels",
      customerEngineerId: "Customer Engineer",
      customerEngineerName: "Customer Engineer Name",
      spoc: "SPOC",
      priority: "Priority",
      useCaseSummary: "Use Case Summary",
      targetDate: "Target Date",
      status: "Status",
      jiraTicket: "Jira Ticket",
    };

    for (const [key, newValue] of Object.entries(data)) {
      if (newValue !== undefined) {
        const oldValue = (currentProject as Record<string, unknown>)[key];
        if (String(oldValue) !== String(newValue)) {
          auditLogs.push({
            projectId: params.id,
            userId: session.user.id,
            userName: session.user.name || session.user.email || "Unknown",
            action: "UPDATE",
            fieldName: fieldLabels[key] || key,
            oldValue: oldValue instanceof Date ? oldValue.toISOString() : String(oldValue || ""),
            newValue: newValue instanceof Date ? newValue.toISOString() : String(newValue || ""),
          });
        }
      }
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: {
        ...data,
        targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
      },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        customerEngineer: { select: { id: true, name: true, email: true } },
        accountName: true,
      },
    });

    // Create audit logs
    if (auditLogs.length > 0) {
      await prisma.auditLog.createMany({ data: auditLogs });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: { accountName: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        projectId: params.id,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        action: "DELETE",
        fieldName: "Project",
        oldValue: project.accountName.name,
        newValue: "",
      },
    });

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
