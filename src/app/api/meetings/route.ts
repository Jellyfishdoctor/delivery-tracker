import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createMeetingSchema = z.object({
  projectId: z.string().min(1, "Project ID is required"),
  meetingDate: z.string().transform((str) => new Date(str)),
  notes: z.string().min(1, "Notes are required"),
  attendees: z.array(z.string()).optional(),
  actionItems: z.array(
    z.object({
      description: z.string().min(1),
      assigneeName: z.string().optional().nullable(),
      dueDate: z.string().optional().nullable().transform((str) => str ? new Date(str) : null),
    })
  ).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 });
    }

    const meetingNotes = await prisma.meetingNote.findMany({
      where: { projectId },
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
      },
      orderBy: { meetingDate: "desc" },
    });

    return NextResponse.json(meetingNotes);
  } catch (error) {
    console.error("Error fetching meeting notes:", error);
    return NextResponse.json(
      { error: "Failed to fetch meeting notes" },
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
    const data = createMeetingSchema.parse(body);

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const meetingNote = await prisma.meetingNote.create({
      data: {
        projectId: data.projectId,
        meetingDate: data.meetingDate,
        notes: data.notes,
        attendees: data.attendees ? JSON.stringify(data.attendees) : null,
        createdById: session.user.id,
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
    console.error("Error creating meeting note:", error);
    return NextResponse.json(
      { error: "Failed to create meeting note" },
      { status: 500 }
    );
  }
}
