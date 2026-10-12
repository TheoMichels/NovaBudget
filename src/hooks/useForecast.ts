import { useMemo } from "react";
import { SavingsAccount } from "../types/savingsAccount";
import { Expense } from "../types/expense";

export function useForecast(
  accounts: SavingsAccount[],
  expenses: Expense[],
  safetyCushionTarget: number = 20000
) {
  return useMemo(() => {
    // 1. Total savings
    const totalSavings = accounts.reduce(
      (sum, a) => sum + (Number(a.amount) || 0),
      0
    );

    // 2. Active expenses
    const activeExpenses = expenses.filter((e) => e.isActive);

    const totalActiveExpenses = activeExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // 3. Post-expenses residual projection
    const postTotalSavings = totalSavings - totalActiveExpenses;

    // 4. Waterfall metrics & safety cushion ratios
    const cushionPct =
      totalSavings > 0
        ? Math.min(100, Math.round((safetyCushionTarget / totalSavings) * 100))
        : 35;

    const expensesPct =
      totalSavings > 0
        ? Math.min(
            100 - cushionPct,
            Math.round((totalActiveExpenses / totalSavings) * 100)
          )
        : 25;

    const freePct = Math.max(0, 100 - cushionPct - expensesPct);

    const retentionRate =
      totalSavings > 0
        ? ((postTotalSavings / totalSavings) * 100).toFixed(1)
        : "0.0";

    return {
      totalSavings,
      activeExpenses,
      totalActiveExpenses,
      postTotalSavings,
      cushionPct,
      freePct,
      expensesPct,
      retentionRate,
      safetyCushionTarget,
    };
  }, [accounts, expenses, safetyCushionTarget]);
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
