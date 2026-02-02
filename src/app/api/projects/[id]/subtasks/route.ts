import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSubtaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  assignee: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
});

const reorderSubtasksSchema = z.object({
  subtaskIds: z.array(z.string()),
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

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const subtasks = await prisma.subtask.findMany({
      where: { projectId: params.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createSubtaskSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get max sort order for this project
    const maxSortOrder = await prisma.subtask.aggregate({
      where: { projectId: params.id },
      _max: { sortOrder: true },
    });

    const subtask = await prisma.subtask.create({
      data: {
        projectId: params.id,
        title: data.title,
        assignee: data.assignee || null,
        dueDate: data.dueDate,
        sortOrder: (maxSortOrder._max.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(subtask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating subtask:", error);
    return NextResponse.json(
      { error: "Failed to create subtask" },
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
    const data = reorderSubtasksSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update sort order for each subtask
    const updates = data.subtaskIds.map((subtaskId, index) =>
      prisma.subtask.update({
        where: { id: subtaskId },
        data: { sortOrder: index },
      })
    );

    await prisma.$transaction(updates);

    const subtasks = await prisma.subtask.findMany({
      where: { projectId: params.id },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(subtasks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error reordering subtasks:", error);
    return NextResponse.json(
      { error: "Failed to reorder subtasks" },
      { status: 500 }
    );
  }
}
