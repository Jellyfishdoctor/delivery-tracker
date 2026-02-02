import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCSV, getDuplicateKey, ParsedRow } from "@/lib/csv-parser";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.name.endsWith(".csv")) {
      return NextResponse.json(
        { error: "File must be a CSV" },
        { status: 400 }
      );
    }

    const content = await file.text();
    const parseResult = await parseCSV(content);

    // Get existing projects to check for duplicates
    const existingProjects = await prisma.project.findMany({
      select: {
        id: true,
        useCaseSummary: true,
        accountName: {
          select: {
            name: true,
          },
        },
      },
    });

    // Create duplicate lookup map
    const existingProjectMap = new Map<string, string>();
    existingProjects.forEach((project) => {
      const key = getDuplicateKey(project.accountName.name, project.useCaseSummary);
      existingProjectMap.set(key, project.id);
    });

    // Check for duplicates in parsed rows
    let duplicateCount = 0;
    parseResult.rows.forEach((row: ParsedRow) => {
      if (row.isValid) {
        const key = getDuplicateKey(row.data.accountName, row.data.useCaseSummary);
        const existingId = existingProjectMap.get(key);
        if (existingId) {
          row.isDuplicate = true;
          row.existingProjectId = existingId;
          duplicateCount++;
        }
      }
    });

    parseResult.duplicateRows = duplicateCount;

    // Validate referenced users exist
    const userEmails = new Set<string>();
    parseResult.rows.forEach((row) => {
      if (row.isValid) {
        userEmails.add(row.data.accountManagerEmail.toLowerCase());
        if (row.data.customerEngineerEmail) {
          userEmails.add(row.data.customerEngineerEmail.toLowerCase());
        }
      }
    });

    const existingUsers = await prisma.user.findMany({
      where: {
        email: {
          in: Array.from(userEmails),
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userEmailToId = new Map<string, string>();
    existingUsers.forEach((user) => {
      userEmailToId.set(user.email.toLowerCase(), user.id);
    });

    // Add errors for missing users
    parseResult.rows.forEach((row) => {
      if (row.isValid) {
        const amEmail = row.data.accountManagerEmail.toLowerCase();
        if (!userEmailToId.has(amEmail)) {
          row.errors.push({
            row: row.rowNumber,
            field: "Account Manager Email",
            message: `User not found: ${row.data.accountManagerEmail}`,
          });
          row.isValid = false;
        }

        const ceEmail = row.data.customerEngineerEmail?.toLowerCase();
        if (ceEmail && !userEmailToId.has(ceEmail)) {
          row.errors.push({
            row: row.rowNumber,
            field: "Customer Engineer Email",
            message: `User not found: ${row.data.customerEngineerEmail}`,
          });
          row.isValid = false;
        }
      }
    });

    // Recalculate counts after user validation
    parseResult.validRows = parseResult.rows.filter((r) => r.isValid).length;
    parseResult.invalidRows = parseResult.rows.filter((r) => !r.isValid).length;

    return NextResponse.json({
      success: true,
      preview: parseResult,
      userMap: Object.fromEntries(userEmailToId),
    });
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse CSV" },
      { status: 500 }
    );
  }
}
