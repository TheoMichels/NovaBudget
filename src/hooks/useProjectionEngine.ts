import { useMemo } from "react";
import { SavingsAccount } from "../types/savingsAccount";
import {
  FutureProject,
  MonthlyContributionConfig,
  OneOffInflow,
  ProjectFeasibility,
  ProjectionEvent,
  ProjectionForecastResult,
  ProjectionMonthPoint,
} from "../types/projection";
import {
  MONTHS_FR,
  formatFrenchMonthYear,
  parseYearMonth,
  toYearMonthString,
} from "../utils/dateUtils";

export function useProjectionEngine(
  accounts: SavingsAccount[],
  projects: FutureProject[],
  inflows: OneOffInflow[],
  monthlyConfig: MonthlyContributionConfig,
  horizonMonths: number = 12,
  safetyCushionTarget: number = 20000
): ProjectionForecastResult {
  return useMemo(() => {
    // 1. Initial capital
    const initialSavings = accounts.reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );

    // 2. Weighted interest rate
    let totalWeightedRate = 0;
    accounts.forEach((a) => {
      const amt = Number(a.amount) || 0;
      const rate = (Number(a.rate) || 0) / 100;
      totalWeightedRate += amt * rate;
    });

    const weightedAnnualRate =
      initialSavings > 0 ? totalWeightedRate / initialSavings : 0.035; // Default 3.5%
    const monthlyRate = weightedAnnualRate / 12;

    // Current starting reference month: based on current date
    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth() + 1;

    const getOffsetMonths = (dateStr: string): number => {
      const { year, month } = parseYearMonth(dateStr);
      return (year - startYear) * 12 + (month - startMonth);
    };

    let runningCapital = initialSavings;
    let accumulatedContributions = 0;
    // Interest earned during the current calendar year stays outside the capital
    // until January of the following year.
    let accumulatedInterest = Math.max(0, initialSavings * monthlyRate) * startMonth;
    let interestAwaitingCredit = accumulatedInterest;
    let totalProjectsOut = 0;
    let totalInflowsIn = 0;

    const monthlyData: ProjectionMonthPoint[] = [];

    const startMonthItem = MONTHS_FR[startMonth - 1];
    const startLabel = `${startMonthItem ? startMonthItem.short : ""} ${String(startYear).slice(2)}`;

    // Month 0 (Starting point)
    monthlyData.push({
      monthIndex: 0,
      dateStr: toYearMonthString(startYear, startMonth),
      label: startLabel,
      capital: Math.round(initialSavings),
      monthlyContribution: 0,
      accumulatedContributions: 0,
      interestEarnedThisMonth: 0,
      accumulatedInterest: Math.round(accumulatedInterest),
      inflowsThisMonth: 0,
      projectsThisMonth: 0,
      events: [],
      isSafe: initialSavings >= safetyCushionTarget,
    });

    // Month 1 to H
    for (let m = 1; m <= horizonMonths; m++) {
      const totalMonthOffset = startMonth - 1 + m;
      const targetDateObj = new Date(startYear, totalMonthOffset, 1);
      const curYear = targetDateObj.getFullYear();
      const curMonth = targetDateObj.getMonth() + 1;
      const dateStr = toYearMonthString(curYear, curMonth);
      const monthItem = MONTHS_FR[curMonth - 1];
      const label = `${monthItem ? monthItem.short : ""} ${String(curYear).slice(2)}`;

      const events: ProjectionEvent[] = [];

      // A. Regular monthly savings
      const monthlyAdd = monthlyConfig.monthlyTotal || 0;
      runningCapital += monthlyAdd;
      accumulatedContributions += monthlyAdd;

      // B. Inflows this month
      let inflowsThisMonth = 0;
      inflows.forEach((inf) => {
        if (inf.isActive && getOffsetMonths(inf.targetDate) === m) {
          const amt = Number(inf.amount) || 0;
          runningCapital += amt;
          inflowsThisMonth += amt;
          totalInflowsIn += amt;
          events.push({
            type: "inflow",
            id: inf.id,
            title: inf.title,
            amount: amt,
          });
        }
      });

      // C. Projects this month
      let projectsThisMonth = 0;
      projects.forEach((proj) => {
        if (proj.isActive && getOffsetMonths(proj.targetDate) === m) {
          const amt = Number(proj.amount) || 0;
          runningCapital -= amt;
          projectsThisMonth += amt;
          totalProjectsOut += amt;
          events.push({
            type: "project",
            id: proj.id,
            title: proj.title,
            amount: amt,
            category: proj.category,
          });
        }
      });

      // D. Credit the previous calendar year's interest in January.
      if (curMonth === 1 && interestAwaitingCredit > 0) {
        runningCapital += interestAwaitingCredit;
        interestAwaitingCredit = 0;
      }

      // E. Interest accrues monthly on projected capital, but is credited only
      // in January. The current-year YTD estimate above uses initial capital.
      const interestEarned = Math.max(0, runningCapital * monthlyRate);
      accumulatedInterest += interestEarned;
      interestAwaitingCredit += interestEarned;

      const roundedCapital = Math.round(runningCapital);

      monthlyData.push({
        monthIndex: m,
        dateStr,
        label,
        capital: roundedCapital,
        monthlyContribution: monthlyAdd,
        accumulatedContributions,
        interestEarnedThisMonth: Math.round(interestEarned),
        accumulatedInterest: Math.round(accumulatedInterest),
        inflowsThisMonth,
        projectsThisMonth,
        events,
        isSafe: roundedCapital >= safetyCushionTarget,
      });
    }

    const finalSavings = Math.round(runningCapital);
    const netDiff = finalSavings - initialSavings;
    const netDiffPct =
      initialSavings > 0 ? (netDiff / initialSavings) * 100 : 0;
    const cushionSurplus = finalSavings - safetyCushionTarget;
    const isHealthy = cushionSurplus >= 0;
    const totalProgrammedSavings = Math.round(
      accumulatedContributions + totalInflowsIn
    );

    // Feasibility calculation for all projects
    const feasibilities: ProjectFeasibility[] = projects.map((proj) => {
      const offset = getOffsetMonths(proj.targetDate);
      const targetLabel = formatFrenchMonthYear(proj.targetDate, "short");
      const monthPoint = monthlyData.find((p) => p.monthIndex === offset);

      // Capital at that month if available, else projected extrapolation
      const capitalAfter = monthPoint ? monthPoint.capital : finalSavings;
      const capitalBefore = capitalAfter + (proj.isActive ? proj.amount : 0);
      const surplus = capitalAfter - safetyCushionTarget;

      const isSafe = surplus >= 0;
      const isFeasible = capitalAfter >= 0;

      let statusText = "✅ Financement sécurisé (coussin préservé)";
      if (!isFeasible) {
        statusText = "❌ Déficit prévisionnel";
      } else if (!isSafe) {
        statusText = `⚠️ Faisable mais entame le coussin de ${Math.abs(Math.round(surplus))} €`;
      }

      return {
        project: proj,
        monthIndex: offset,
        targetLabel,
        capitalBeforeProject: Math.round(capitalBefore),
        capitalAfterProject: Math.round(capitalAfter),
        surplusAboveCushion: Math.round(surplus),
        isFeasible,
        isSafe,
        statusText,
      };
    });

    // Required monthly savings calculation
    // Goal: final savings at horizon >= safetyCushionTarget
    const rawDeficit =
      safetyCushionTarget +
      totalProjectsOut -
      (initialSavings + totalInflowsIn + accumulatedInterest);
    const requiredMonthlySavingsForProjects = Math.max(
      0,
      Math.round(rawDeficit / horizonMonths)
    );

    return {
      horizonMonths,
      initialSavings: Math.round(initialSavings),
      finalSavings,
      netDiff,
      netDiffPct: parseFloat(netDiffPct.toFixed(1)),
      totalMonthlySaved: Math.round(accumulatedContributions),
      totalProgrammedSavings,
      totalInterest: Math.round(accumulatedInterest),
      totalProjectsOut: Math.round(totalProjectsOut),
      totalInflowsIn: Math.round(totalInflowsIn),
      weightedAnnualRate: parseFloat((weightedAnnualRate * 100).toFixed(2)),
      cushionSurplus: Math.round(cushionSurplus),
      isHealthy,
      monthlyData,
      feasibilities,
      requiredMonthlySavingsForProjects,
    };
  }, [
    accounts,
    projects,
    inflows,
    monthlyConfig,
    horizonMonths,
    safetyCushionTarget,
  ]);
}
