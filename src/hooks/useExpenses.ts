import { useCallback, useEffect, useState } from "react";
import { Expense } from "../types/expense";
import {
  addExpense,
  deleteExpense,
  getExpenses,
  toggleExpenseActive,
  updateExpense,
} from "../storage/expenseRepository";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpenses();
      setExpenses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement des dépenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    async (data: Omit<Expense, "id" | "updatedAt">) => {
      const created = await addExpense(data);
      setExpenses((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Omit<Expense, "id">>) => {
      const updated = await updateExpense(id, updates);
      if (updated) {
        setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
      }
      return updated;
    },
    []
  );

  const handleToggleActive = useCallback(async (id: string) => {
    const updated = await toggleExpenseActive(id);
    if (updated) {
      setExpenses((prev) => prev.map((e) => (e.id === id ? updated : e)));
    }
    return updated;
  }, []);

  const handleRemove = useCallback(async (id: string) => {
    await deleteExpense(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return {
    expenses,
    loading,
    error,
    reload: load,
    addExpense: handleAdd,
    updateExpense: handleUpdate,
    toggleExpenseActive: handleToggleActive,
    removeExpense: handleRemove,
  };
}
