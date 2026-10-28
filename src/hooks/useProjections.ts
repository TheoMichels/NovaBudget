import { getCloudReadError } from "../services/syncService";
import { contributionSchema, validate } from "../types/validation";
import { isLocalMode } from "../config/storageMode";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentUser, onAuthStateChange } from "../services/authService";
import {
  addFutureProject,
  addInflow,
  deleteFutureProject,
  deleteInflow,
  getFutureProjects,
  getInflows,
  getMonthlyContribution,
  saveMonthlyContribution,
  toggleFutureProjectActive,
  toggleInflowActive,
  updateFutureProject,
  updateInflow,
} from "../storage/projectionRepository";
import {
  FutureProject,
  MonthlyContributionConfig,
  OneOffInflow,
} from "../types/projection";

const DEFAULT_MONTHLY_CONFIG: MonthlyContributionConfig = {
  monthlyTotal: 0,
};

export function useProjections() {
  const [projects, setProjects] = useState<FutureProject[]>([]);
  const [inflows, setInflows] = useState<OneOffInflow[]>([]);
  const [monthlyConfig, setMonthlyConfig] =
    useState<MonthlyContributionConfig>(DEFAULT_MONTHLY_CONFIG);
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
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
        setProjects([]);
        setInflows([]);
        setMonthlyConfig(DEFAULT_MONTHLY_CONFIG);
        return;
      }

      const [projData, infData, monthData] = await Promise.all([
        getFutureProjects(uid ?? undefined),
        getInflows(uid ?? undefined),
        getMonthlyContribution(uid ?? undefined),
      ]);
      setProjects(projData);
      setInflows(infData);
      setMonthlyConfig(monthData);
      setError(getCloudReadError("future_projects") ?? getCloudReadError("inflows") ?? getCloudReadError("user_settings"));
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Erreur de chargement des projections"
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
          setProjects([]);
          setInflows([]);
          setMonthlyConfig(DEFAULT_MONTHLY_CONFIG);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setProjects([]);
          setInflows([]);
          setMonthlyConfig(DEFAULT_MONTHLY_CONFIG);
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
        setProjects([]);
        setInflows([]);
        setMonthlyConfig(DEFAULT_MONTHLY_CONFIG);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [load]);

  // Projects Handlers
  const handleAddProject = useCallback(
    async (data: Omit<FutureProject, "id" | "updatedAt">) => {
      const created = await addFutureProject(data);
      setProjects((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const handleUpdateProject = useCallback(
    async (id: string, updates: Partial<Omit<FutureProject, "id">>) => {
      const updated = await updateFutureProject(id, updates);
      if (updated) {
        setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      }
      return updated;
    },
    []
  );

  const handleToggleProject = useCallback(async (id: string) => {
    const updated = await toggleFutureProjectActive(id);
    if (updated) {
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    }
    return updated;
  }, []);

  const handleRemoveProject = useCallback(async (id: string) => {
    await deleteFutureProject(id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Inflows Handlers
  const handleAddInflow = useCallback(
    async (data: Omit<OneOffInflow, "id" | "updatedAt">) => {
      const created = await addInflow(data);
      setInflows((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const handleUpdateInflow = useCallback(
    async (id: string, updates: Partial<Omit<OneOffInflow, "id">>) => {
      const updated = await updateInflow(id, updates);
      if (updated) {
        setInflows((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
      return updated;
    },
    []
  );

  const handleToggleInflow = useCallback(async (id: string) => {
    const updated = await toggleInflowActive(id);
    if (updated) {
      setInflows((prev) => prev.map((i) => (i.id === id ? updated : i)));
    }
    return updated;
  }, []);

  const handleRemoveInflow = useCallback(async (id: string) => {
    await deleteInflow(id);
    setInflows((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Monthly Config Handlers
  const handleUpdateMonthlyTotal = useCallback(
    async (total: number) => {
      try {
        const newConfig = validate(contributionSchema, { monthlyTotal: total });
        setMonthlyConfig(newConfig);
        await saveMonthlyContribution(newConfig);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Enregistrement impossible.");
      }
    },
    []
  );

  return {
    projects,
    inflows,
    monthlyConfig,
    horizonMonths,
    loading,
    error,
    reload: () => load(),
    setHorizonMonths,
    addProject: handleAddProject,
    updateProject: handleUpdateProject,
    toggleProject: handleToggleProject,
    removeProject: handleRemoveProject,
    addInflow: handleAddInflow,
    updateInflow: handleUpdateInflow,
    toggleInflow: handleToggleInflow,
    removeInflow: handleRemoveInflow,
    updateMonthlyTotal: handleUpdateMonthlyTotal,
  };
}
