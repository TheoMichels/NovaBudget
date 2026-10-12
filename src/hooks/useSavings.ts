import { useCallback, useEffect, useState } from "react";
import { SavingsAccount } from "../types/savingsAccount";
import {
  addSavings,
  deleteSavings,
  getSavings,
  updateSavings,
} from "../storage/savingsRepository";

export function useSavings() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSavings();
      setAccounts(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement des épargnes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = useCallback(
    async (data: Omit<SavingsAccount, "id" | "updatedAt">) => {
      const created = await addSavings(data);
      setAccounts((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const handleUpdate = useCallback(
    async (id: string, updates: Partial<Omit<SavingsAccount, "id">>) => {
      const updated = await updateSavings(id, updates);
      if (updated) {
        setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      }
      return updated;
    },
    []
  );

  const handleRemove = useCallback(async (id: string) => {
    await deleteSavings(id);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    accounts,
    loading,
    error,
    reload: load,
    addAccount: handleAdd,
    updateAccount: handleUpdate,
    removeAccount: handleRemove,
  };
}
