import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MAX_CAPACITY = 6; // Default max projects per CE

interface ProjectInfo {
  id: string;
  accountName: string;
  useCaseSummary: string;
  stage: string;
  status: string;
}

interface EngineerAllocation {
  id: string;
  name: string;
  email: string;
  projectCount: number;
  capacity: number;
  projects: ProjectInfo[];
}

interface ResourceAllocation {
  engineers: EngineerAllocation[];
  unassigned: ProjectInfo[];
  summary: {
    totalProjects: number;
    assignedProjects: number;
    unassignedProjects: number;
    avgPerCE: number;
    maxCapacity: number;
    ceCompletions: number;
    assignedAccountNames: string[];
    unassignedAccountNames: string[];
  };
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ceId = searchParams.get("ce");

    // Get all active projects with their account names and CEs
    const projects = await prisma.project.findMany({
      where: {
        status: {
          not: "COMPLETED", // Only active projects count towards allocation
        },
      },
      include: {
        accountName: true,
        customerEngineer: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Get completed projects count for CE completions stat
    const completedProjects = await prisma.project.count({
      where: {
        status: "COMPLETED",
        OR: [
          { customerEngineerId: { not: null } },
          { customerEngineerName: { not: null } },
        ],
      },
    });

    // Get all customer engineers (users with CE role)
    const customerEngineers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER_ENGINEER",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Also include any users who are assigned as CEs on projects but might not have CE role
    const assignedCEIds = new Set(
      projects
        .filter((p) => p.customerEngineerId)
        .map((p) => p.customerEngineerId!)
    );

    const additionalCEs = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(assignedCEIds),
        },
        role: {
          not: "CUSTOMER_ENGINEER",
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    const allCEs = [...customerEngineers, ...additionalCEs];

    // If filtering by specific CE
    if (ceId) {
      const ce = allCEs.find((c) => c.id === ceId);
      if (!ce) {
        return NextResponse.json({ error: "Customer Engineer not found" }, { status: 404 });
      }

      const ceProjects = projects.filter((p) => p.customerEngineerId === ceId);

      const allocation: ResourceAllocation = {
        engineers: [
          {
            id: ce.id,
            name: ce.name || ce.email,
            email: ce.email,
            projectCount: ceProjects.length,
            capacity: Math.round((ceProjects.length / MAX_CAPACITY) * 100),
            projects: ceProjects.map((p) => ({
              id: p.id,
              accountName: p.accountName.name,
              useCaseSummary: p.useCaseSummary,
              stage: p.stage,
              status: p.status,
            })),
          },
        ],
        unassigned: [],
        summary: {
          totalProjects: ceProjects.length,
          assignedProjects: ceProjects.length,
          unassignedProjects: 0,
          avgPerCE: ceProjects.length,
          maxCapacity: MAX_CAPACITY,
          ceCompletions: 0,
          assignedAccountNames: Array.from(new Set(ceProjects.map(p => p.accountName.name))),
          unassignedAccountNames: [],
        },
      };

      return NextResponse.json(allocation);
    }

    // Build allocation for all CEs
    const engineerMap = new Map<string, ProjectInfo[]>();
    const unassigned: ProjectInfo[] = [];

    // Initialize map for all known CEs
    allCEs.forEach((ce) => {
      engineerMap.set(ce.id, []);
    });

    // Distribute projects
    projects.forEach((p) => {
      const projectInfo: ProjectInfo = {
        id: p.id,
        accountName: p.accountName.name,
        useCaseSummary: p.useCaseSummary,
        stage: p.stage,
        status: p.status,
      };

      if (p.customerEngineerId && engineerMap.has(p.customerEngineerId)) {
        engineerMap.get(p.customerEngineerId)!.push(projectInfo);
      } else if (p.customerEngineerName) {
        // Handle free-form CE name (group by name)
        // For now, add to unassigned since they're not in our user system
        unassigned.push(projectInfo);
      } else {
        unassigned.push(projectInfo);
      }
    });

    // Also handle projects with free-form CE names by grouping them
    const freeformCEProjects = new Map<string, ProjectInfo[]>();
    projects.forEach((p) => {
      if (!p.customerEngineerId && p.customerEngineerName) {
        const name = p.customerEngineerName;
        if (!freeformCEProjects.has(name)) {
          freeformCEProjects.set(name, []);
        }
        freeformCEProjects.get(name)!.push({
          id: p.id,
          accountName: p.accountName.name,
          useCaseSummary: p.useCaseSummary,
          stage: p.stage,
          status: p.status,
        });
      }
    });

    // Build engineers list
    const engineers: EngineerAllocation[] = [];

    allCEs.forEach((ce) => {
      const ceProjects = engineerMap.get(ce.id) || [];
      engineers.push({
        id: ce.id,
        name: ce.name || ce.email,
        email: ce.email,
        projectCount: ceProjects.length,
        capacity: Math.round((ceProjects.length / MAX_CAPACITY) * 100),
        projects: ceProjects,
      });
    });

    // Add free-form CE allocations
    freeformCEProjects.forEach((ceProjects, ceName) => {
      engineers.push({
        id: `freeform-${ceName}`,
        name: ceName,
        email: "",
        projectCount: ceProjects.length,
        capacity: Math.round((ceProjects.length / MAX_CAPACITY) * 100),
        projects: ceProjects,
      });
      // Remove from unassigned since they have a CE name
      ceProjects.forEach((fp) => {
        const idx = unassigned.findIndex((u) => u.id === fp.id);
        if (idx !== -1) {
          unassigned.splice(idx, 1);
        }
      });
    });

    // Sort engineers by project count (highest first)
    engineers.sort((a, b) => b.projectCount - a.projectCount);

    const assignedCount = projects.length - unassigned.length;
    const avgPerCE = engineers.length > 0 ? assignedCount / engineers.length : 0;

    // Get unique account names for assigned and unassigned projects
    const assignedProjects = projects.filter(
      (p) => p.customerEngineerId || p.customerEngineerName
    );
    const assignedAccountNames = Array.from(new Set(assignedProjects.map((p) => p.accountName.name)));
    const unassignedAccountNames = Array.from(new Set(unassigned.map((p) => p.accountName)));

    const allocation: ResourceAllocation = {
      engineers,
      unassigned,
      summary: {
        totalProjects: projects.length,
        assignedProjects: assignedCount,
        unassignedProjects: unassigned.length,
        avgPerCE: Math.round(avgPerCE * 10) / 10,
        maxCapacity: MAX_CAPACITY,
        ceCompletions: completedProjects,
        assignedAccountNames,
        unassignedAccountNames,
      },
    };

    return NextResponse.json(allocation);
  } catch (error) {
    console.error("Error fetching resource allocation:", error);
    return NextResponse.json(
      { error: "Failed to fetch resource allocation" },
      { status: 500 }
    );
  }
}
