import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createActionItemSchema = z.object({
  meetingNoteId: z.string().min(1, "Meeting note ID is required"),
  description: z.string().min(1, "Description is required"),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createActionItemSchema.parse(body);

    // Verify meeting note exists
    const meetingNote = await prisma.meetingNote.findUnique({
      where: { id: data.meetingNoteId },
    });

    if (!meetingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 });
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        meetingNoteId: data.meetingNoteId,
        description: data.description,
        assigneeId: data.assigneeId || null,
        dueDate: data.dueDate,
        status: "PENDING",
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(actionItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating action item:", error);
    return NextResponse.json(
      { error: "Failed to create action item" },
      { status: 500 }
    );
  }
}
