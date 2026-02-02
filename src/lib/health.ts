// Health Score Calculation Utility
// New Algorithm (Stage-Based + Time-Based):
//
// Core Principle: Account health is a function of delivery stage AND time remaining
//
// Rule 1: Blocked = Critical (regardless of stage or time)
// Rule 2: Overdue = At Risk max (unless blocked → Critical)
// Rule 3: Stage-Based Caps:
//   - PRODUCTION: Can achieve Good (delivery completed)
//   - POC/ONBOARDING: Max is Fair (still pending delivery)
// Rule 4: Time-Based Risk (7/3/1 Rule) for POC/ONBOARDING:
//   - > 7 days: Fair
//   - ≤ 7 days: Fair (getting close)
//   - ≤ 3 days: At Risk (urgent)
//   - ≤ 1 day: Critical (immediate action)
//   - Overdue: Critical

export type HealthStatus = 'Critical' | 'At Risk' | 'Fair' | 'Good';

export interface ProjectForHealth {
  status: string;
  priority: string;
  targetDate: Date | string;
  updatedAt?: Date | string;
  stage: string;  // POC, ONBOARDING, PRODUCTION
}

export interface HealthResult {
  score: number;
  status: HealthStatus;
  breakdown: {
    overdueCount: number;
    blockedCount: number;
    pendingProjectsCount: number;
    minDaysRemaining: number | null;
  };
}

export function getDaysUntilTarget(targetDate: Date | string): number {
  const target = new Date(targetDate);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function isOverdue(project: ProjectForHealth): boolean {
  if (project.status === 'COMPLETED') return false;
  const targetDate = new Date(project.targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);
  return targetDate < today;
}

export function isBlocked(project: ProjectForHealth): boolean {
  return project.status === 'BLOCKED';
}

export function isPendingStage(project: ProjectForHealth): boolean {
  return project.stage === 'POC' || project.stage === 'ONBOARDING';
}

export function calculateHealthScore(projects: ProjectForHealth[]): HealthResult {
  // Skip completed projects for health calculation
  const activeProjects = projects.filter(p => p.status !== 'COMPLETED');

  // If no active projects, all are completed = Good health
  if (activeProjects.length === 0) {
    return {
      score: 100,
      status: 'Good',
      breakdown: {
        overdueCount: 0,
        blockedCount: 0,
        pendingProjectsCount: 0,
        minDaysRemaining: null,
      },
    };
  }

  const blockedCount = activeProjects.filter(isBlocked).length;
  const overdueCount = activeProjects.filter(isOverdue).length;
  const pendingProjects = activeProjects.filter(isPendingStage);
  const hasProduction = activeProjects.some(p => p.stage === 'PRODUCTION');

  // Calculate minimum days remaining for pending projects
  let minDaysRemaining: number | null = null;
  if (pendingProjects.length > 0) {
    minDaysRemaining = Math.min(
      ...pendingProjects.map(p => getDaysUntilTarget(p.targetDate))
    );
  }

  // Rule 1: Blocked = Critical
  if (blockedCount > 0) {
    return {
      score: 0,
      status: 'Critical',
      breakdown: {
        overdueCount,
        blockedCount,
        pendingProjectsCount: pendingProjects.length,
        minDaysRemaining,
      },
    };
  }

  // Rule 2: Overdue = At Risk max
  if (overdueCount > 0) {
    return {
      score: 40,
      status: 'At Risk',
      breakdown: {
        overdueCount,
        blockedCount,
        pendingProjectsCount: pendingProjects.length,
        minDaysRemaining,
      },
    };
  }

  // If only Production projects (no pending), can be Good
  if (pendingProjects.length === 0 && hasProduction) {
    return {
      score: 100,
      status: 'Good',
      breakdown: {
        overdueCount,
        blockedCount,
        pendingProjectsCount: 0,
        minDaysRemaining: null,
      },
    };
  }

  // Rule 3: Time-based status for pending deliveries (POC/ONBOARDING)
  if (minDaysRemaining !== null) {
    if (minDaysRemaining <= 1) {
      return {
        score: 15,
        status: 'Critical',
        breakdown: {
          overdueCount,
          blockedCount,
          pendingProjectsCount: pendingProjects.length,
          minDaysRemaining,
        },
      };
    }
    if (minDaysRemaining <= 3) {
      return {
        score: 40,
        status: 'At Risk',
        breakdown: {
          overdueCount,
          blockedCount,
          pendingProjectsCount: pendingProjects.length,
          minDaysRemaining,
        },
      };
    }
  }

  // ≤ 7 days or more = Fair (max for non-Production)
  return {
    score: 65,
    status: 'Fair',
    breakdown: {
      overdueCount,
      blockedCount,
      pendingProjectsCount: pendingProjects.length,
      minDaysRemaining,
    },
  };
}

export function mapScoreToStatus(score: number): HealthStatus {
  if (score <= 25) return 'Critical';
  if (score <= 50) return 'At Risk';
  if (score <= 75) return 'Fair';
  return 'Good';
}

export function getHealthColor(status: HealthStatus): string {
  switch (status) {
    case 'Critical':
      return 'text-red-600';
    case 'At Risk':
      return 'text-orange-500';
    case 'Fair':
      return 'text-yellow-500';
    case 'Good':
      return 'text-green-500';
  }
}

export function getHealthBgColor(status: HealthStatus): string {
  switch (status) {
    case 'Critical':
      return 'bg-red-100';
    case 'At Risk':
      return 'bg-orange-100';
    case 'Fair':
      return 'bg-yellow-100';
    case 'Good':
      return 'bg-green-100';
  }
}

// Get filled dots count for health indicator (out of 5)
export function getHealthDots(score: number): number {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}
