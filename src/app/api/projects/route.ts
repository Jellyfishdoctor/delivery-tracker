import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProjectSchema = z.object({
  accountManagerId: z.string().min(1, "Account manager is required"),
  accountNameId: z.string().optional(),
  accountNameNew: z.string().optional(),
  stage: z.enum(["POC", "ONBOARDING", "PRODUCTION"]),
  product: z.enum(["ANALYTICS", "AI_AGENT"]),
  spoc: z.string().min(1, "SPOC is required"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  useCaseSummary: z.string().min(1, "Use case summary is required"),
  targetDate: z.string().transform((str) => new Date(str)),
  status: z.enum(["NOT_STARTED", "IN_PROGRESS", "ON_HOLD", "COMPLETED", "BLOCKED"]),
  jiraTicket: z.string().optional(),
});

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
    const search = searchParams.get("search");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Record<string, unknown> = {};

    if (stage) where.stage = stage;
    if (product) where.product = product;
    if (priority) where.priority = priority;
    if (status) where.status = status;
    if (accountManagerId) where.accountManagerId = accountManagerId;

    if (dateFrom || dateTo) {
      where.targetDate = {};
      if (dateFrom) (where.targetDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.targetDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    if (search) {
      where.OR = [
        { accountName: { name: { contains: search } } },
        { spoc: { contains: search } },
        { useCaseSummary: { contains: search } },
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        accountManager: {
          select: { id: true, name: true, email: true },
        },
        accountName: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    let accountNameId = data.accountNameId;

    // Create new account name if provided
    if (data.accountNameNew && !accountNameId) {
      const accountName = await prisma.accountName.upsert({
        where: { name: data.accountNameNew },
        update: {},
        create: { name: data.accountNameNew },
      });
      accountNameId = accountName.id;
    }

    if (!accountNameId) {
      return NextResponse.json(
        { error: "Account name is required" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        accountManagerId: data.accountManagerId,
        accountNameId,
        stage: data.stage,
        product: data.product,
        spoc: data.spoc,
        priority: data.priority,
        useCaseSummary: data.useCaseSummary,
        targetDate: data.targetDate,
        status: data.status,
        jiraTicket: data.jiraTicket || null,
      },
      include: {
        accountManager: { select: { id: true, name: true, email: true } },
        accountName: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        userId: session.user.id,
        userName: session.user.name || session.user.email || "Unknown",
        action: "CREATE",
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
