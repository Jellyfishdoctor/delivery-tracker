import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRow, CSVRow } from "@/lib/csv-parser";

interface ImportRow {
  rowNumber: number;
  data: CSVRow;
  isDuplicate: boolean;
  existingProjectId?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rows, userMap } = body as {
      rows: ImportRow[];
      userMap: Record<string, string>;
    };

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as { rowNumber: number; error: string }[],
    };

    for (const row of rows) {
      try {
        const normalized = normalizeRow(row.data);

        // Get or create account name
        let accountName = await prisma.accountName.findUnique({
          where: { name: normalized.accountName },
        });

        if (!accountName) {
          accountName = await prisma.accountName.create({
            data: { name: normalized.accountName },
          });
        }

        // Get user IDs
        const accountManagerId = userMap[normalized.accountManagerEmail];
        const customerEngineerId = normalized.customerEngineerEmail
          ? userMap[normalized.customerEngineerEmail]
          : null;

        if (!accountManagerId) {
          results.failed++;
          results.errors.push({
            rowNumber: row.rowNumber,
            error: `Account manager not found: ${normalized.accountManagerEmail}`,
          });
          continue;
        }

        const projectData = {
          accountManagerId,
          accountNameId: accountName.id,
          stage: normalized.stage,
          product: normalized.product,
          channels: normalized.channels,
          customerEngineerId,
          spoc: normalized.spoc,
          priority: normalized.priority,
          useCaseSummary: normalized.useCaseSummary,
          targetDate: normalized.targetDate,
          status: normalized.status,
          jiraTicket: normalized.jiraTicket,
        };

        if (row.isDuplicate && row.existingProjectId) {
          // Update existing project
          await prisma.project.update({
            where: { id: row.existingProjectId },
            data: projectData,
          });

          // Create audit log for update
          await prisma.auditLog.create({
            data: {
              projectId: row.existingProjectId,
              userId: session.user.id,
              userName: session.user.name || session.user.email || "Unknown",
              action: "UPDATE",
              fieldName: "CSV Import",
              oldValue: "",
              newValue: "Bulk updated via CSV import",
            },
          });

          results.updated++;
        } else {
          // Create new project
          const project = await prisma.project.create({
            data: projectData,
          });

          // Create audit log for creation
          await prisma.auditLog.create({
            data: {
              projectId: project.id,
              userId: session.user.id,
              userName: session.user.name || session.user.email || "Unknown",
              action: "CREATE",
              fieldName: "CSV Import",
              oldValue: "",
              newValue: "Created via CSV import",
            },
          });

          results.created++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          rowNumber: row.rowNumber,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error("Error importing CSV:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to import CSV" },
      { status: 500 }
    );
  }
}
