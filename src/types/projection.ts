import { ExpenseCategory } from "./expense";

export interface FutureProject {
  id: string;
  title: string;
  amount: number;
  targetDate: string; // "YYYY-MM", e.g. "2027-10"
  category: ExpenseCategory;
  isActive: boolean;
  notes?: string;
  updatedAt: string;
}

export interface OneOffInflow {
  id: string;
  title: string;
  amount: number;
  targetDate: string; // "YYYY-MM", e.g. "2026-12"
  isActive: boolean;
  notes?: string;
  updatedAt: string;
}

export interface MonthlyContributionConfig {
  monthlyTotal: number;
}

export interface ProjectionEvent {
  type: "project" | "inflow";
  id: string;
  title: string;
  amount: number;
  category?: ExpenseCategory;
}

export interface ProjectionMonthPoint {
  monthIndex: number; // 0 is starting month, 1 is M+1, etc.
  dateStr: string; // "YYYY-MM"
  label: string; // "Oct. 26", "Nov. 26", etc.
  capital: number;
  monthlyContribution: number;
  accumulatedContributions: number;
  interestEarnedThisMonth: number;
  accumulatedInterest: number;
  inflowsThisMonth: number;
  projectsThisMonth: number;
  events: ProjectionEvent[];
  isSafe: boolean;
}

export interface ProjectFeasibility {
  project: FutureProject;
  monthIndex: number;
  targetLabel: string;
  capitalBeforeProject: number;
  capitalAfterProject: number;
  surplusAboveCushion: number;
  isFeasible: boolean; // capitalAfterProject >= 0
  isSafe: boolean; // capitalAfterProject >= safetyCushion
  statusText: string;
}

export interface ProjectionForecastResult {
  horizonMonths: number;
  initialSavings: number;
  finalSavings: number;
  netDiff: number;
  netDiffPct: number;
  totalMonthlySaved: number;
  totalProgrammedSavings: number;
  totalInterest: number;
  totalProjectsOut: number;
  totalInflowsIn: number;
  weightedAnnualRate: number; // e.g. 0.037 (3.7%)
  cushionSurplus: number;
  isHealthy: boolean;
  monthlyData: ProjectionMonthPoint[];
  feasibilities: ProjectFeasibility[];
  requiredMonthlySavingsForProjects: number;
}
