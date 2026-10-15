import { isLocalMode } from "../config/storageMode";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import {
  addExpense,
  deleteExpense,
  getExpenses,
  toggleExpenseActive,
  updateExpense,
} from "../storage/expenseRepository";
import { Expense } from "../types/expense";

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const uid = isLocalMode ? null : userId ?? (await getCurrentUser())?.id ?? null;
      currentUserIdRef.current = uid;

      if (!isLocalMode && !uid) {
        setExpenses([]);
        return;
      }

      const data = await getExpenses(uid ?? undefined);
      setExpenses(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur de chargement des dépenses"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isLocalMode) {
      void load();
      return () => { isMounted = false; };
    }

    // Chargement initial
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          load(user.id);
        } else {
          setExpenses([]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setExpenses([]);
          setLoading(false);
        }
      });

    // Écoute des changements de session / déconnexion / connexion
    const subscription = onAuthStateChange((_session, user) => {
      if (!isMounted) return;
      if (user) {
        load(user.id);
      } else {
        currentUserIdRef.current = null;
        setExpenses([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
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
    reload: () => load(),
    addExpense: handleAdd,
    updateExpense: handleUpdate,
    toggleExpenseActive: handleToggleActive,
    removeExpense: handleRemove,
  };
}
