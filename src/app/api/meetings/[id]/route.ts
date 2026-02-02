import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateMeetingSchema = z.object({
  projectId: z.string().optional(),
  meetingDate: z.string().transform((str) => new Date(str)).optional(),
  notes: z.string().min(1).optional(),
  attendees: z.array(z.string()).optional(),
  actionItems: z.array(
    z.object({
      id: z.string().optional(),
      description: z.string().min(1),
      assigneeName: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
    })
  ).optional(),
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

    const meetingNote = await prisma.meetingNote.findUnique({
      where: { id: params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        actionItems: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        project: {
          include: {
            accountName: true,
          },
        },
      },
    });

    if (!meetingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 });
    }

    return NextResponse.json(meetingNote);
  } catch (error) {
    console.error("Error fetching meeting note:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting note" },
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
    const data = updateMeetingSchema.parse(body);

    const existingNote = await prisma.meetingNote.findUnique({
      where: { id: params.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 });
    }

    // If action items are provided, delete existing ones and create new ones
    if (data.actionItems) {
      await prisma.actionItem.deleteMany({
        where: { meetingNoteId: params.id },
      });
    }

    const meetingNote = await prisma.meetingNote.update({
      where: { id: params.id },
      data: {
        meetingDate: data.meetingDate,
        notes: data.notes,
        attendees: data.attendees ? JSON.stringify(data.attendees) : undefined,
        actionItems: data.actionItems
          ? {
              create: data.actionItems.map((item) => ({
                description: item.description,
                assigneeName: item.assigneeName || null,
                dueDate: item.dueDate,
                status: "PENDING",
              })),
            }
          : undefined,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        actionItems: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(meetingNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error updating meeting note:", error);
    return NextResponse.json(
      { error: "Failed to update meeting note" },
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

    const existingNote = await prisma.meetingNote.findUnique({
      where: { id: params.id },
    });

    if (!existingNote) {
      return NextResponse.json({ error: "Meeting note not found" }, { status: 404 });
    }

    await prisma.meetingNote.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting meeting note:", error);
    return NextResponse.json(
      { error: "Failed to delete meeting note" },
      { status: 500 }
    );
  }
}
