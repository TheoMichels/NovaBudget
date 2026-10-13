import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import {
  addSavings,
  deleteSavings,
  getSavings,
  updateSavings,
} from "../storage/savingsRepository";
import { SavingsAccount } from "../types/savingsAccount";

export function useSavings() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  const load = useCallback(async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const uid = userId ?? (await getCurrentUser())?.id ?? null;
      currentUserIdRef.current = uid;

      if (!uid) {
        setAccounts([]);
        return;
      }

      const data = await getSavings(uid);
      setAccounts(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur de chargement des épargnes"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Chargement initial
    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        if (user) {
          load(user.id);
        } else {
          setAccounts([]);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccounts([]);
          setLoading(false);
        }
      });

    // Écoute des changements d'authentification
    const subscription = onAuthStateChange((_session, user) => {
      if (!isMounted) return;
      if (user) {
        load(user.id);
      } else {
        currentUserIdRef.current = null;
        setAccounts([]);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [load]);

  const handleAdd = useCallback(
    async (data: Omit<SavingsAccount, "id" | "updatedAt">) => {
      const created = await addSavings(
        data,
        currentUserIdRef.current ?? undefined
      );
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
    reload: () => load(),
    addAccount: handleAdd,
    updateAccount: handleUpdate,
    removeAccount: handleRemove,
  };
}
