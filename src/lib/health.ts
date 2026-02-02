// Health Score Calculation Utility
// Algorithm:
// Base: 100 points
// - Each overdue project: -15
// - Each blocked project: -20
// - High priority at risk: -10
// + Recent completions (last 30 days): +5 each
// Score mapped to: Critical (0-25), At Risk (26-50), Fair (51-75), Good (76-100)

export type HealthStatus = 'Critical' | 'At Risk' | 'Fair' | 'Good';

export interface ProjectForHealth {
  status: string;
  priority: string;
  targetDate: Date | string;
  updatedAt?: Date | string;
}

export interface HealthResult {
  score: number;
  status: HealthStatus;
  breakdown: {
    overdueCount: number;
    blockedCount: number;
    highPriorityAtRiskCount: number;
    recentCompletionsCount: number;
  };
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

export function isHighPriorityAtRisk(project: ProjectForHealth): boolean {
  if (project.priority !== 'HIGH') return false;
  if (project.status === 'COMPLETED') return false;

  // At risk: blocked or overdue
  return isBlocked(project) || isOverdue(project);
}

export function isRecentCompletion(project: ProjectForHealth): boolean {
  if (project.status !== 'COMPLETED') return false;
  if (!project.updatedAt) return false;

  const updatedAt = new Date(project.updatedAt);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return updatedAt >= thirtyDaysAgo;
}

export function calculateHealthScore(projects: ProjectForHealth[]): HealthResult {
  let score = 100;

  const overdueCount = projects.filter(isOverdue).length;
  const blockedCount = projects.filter(isBlocked).length;
  const highPriorityAtRiskCount = projects.filter(isHighPriorityAtRisk).length;
  const recentCompletionsCount = projects.filter(isRecentCompletion).length;

  // Apply penalties
  score -= overdueCount * 15;
  score -= blockedCount * 20;
  score -= highPriorityAtRiskCount * 10;

  // Apply bonuses
  score += recentCompletionsCount * 5;

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    status: mapScoreToStatus(score),
    breakdown: {
      overdueCount,
      blockedCount,
      highPriorityAtRiskCount,
      recentCompletionsCount,
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
