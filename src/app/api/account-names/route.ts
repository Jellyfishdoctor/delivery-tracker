import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAccountNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accountNames = await prisma.accountName.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(accountNames);
  } catch (error) {
    console.error("Error fetching account names:", error);
    return NextResponse.json(
      { error: "Failed to fetch account names" },
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
    const { name } = createAccountNameSchema.parse(body);

    // Check if account name already exists
    const existing = await prisma.accountName.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const accountName = await prisma.accountName.create({
      data: { name },
    });

    return NextResponse.json(accountName);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error("Error creating account name:", error);
    return NextResponse.json(
      { error: "Failed to create account name" },
      { status: 500 }
    );
  }
}
