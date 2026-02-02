import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSubtaskSchema = z.object({
  title: z.string().min(1).optional(),
  assignee: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
  completed: z.boolean().optional(),
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

    const subtask = await prisma.subtask.findUnique({
      where: { id: params.id },
    });

    if (!subtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    return NextResponse.json(subtask);
  } catch (error) {
    console.error("Error fetching subtask:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtask" },
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
    const data = updateSubtaskSchema.parse(body);

    const existingSubtask = await prisma.subtask.findUnique({
      where: { id: params.id },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    // Handle completed state change
    const updateData: Record<string, unknown> = { ...data };
    if (data.completed !== undefined) {
      if (data.completed && !existingSubtask.completed) {
        updateData.completedAt = new Date();
      } else if (!data.completed && existingSubtask.completed) {
        updateData.completedAt = null;
      }
    }

    const subtask = await prisma.subtask.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(subtask);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating subtask:", error);
    return NextResponse.json(
      { error: "Failed to update subtask" },
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

    const existingSubtask = await prisma.subtask.findUnique({
      where: { id: params.id },
    });

    if (!existingSubtask) {
      return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
    }

    await prisma.subtask.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subtask:", error);
    return NextResponse.json(
      { error: "Failed to delete subtask" },
      { status: 500 }
    );
  }
}
