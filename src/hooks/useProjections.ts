import { useCallback, useEffect, useState } from "react";
import {
  FutureProject,
  MonthlyContributionConfig,
  OneOffInflow,
} from "../types/projection";
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

export function useProjections() {
  const [projects, setProjects] = useState<FutureProject[]>([]);
  const [inflows, setInflows] = useState<OneOffInflow[]>([]);
  const [monthlyConfig, setMonthlyConfig] = useState<MonthlyContributionConfig>({
    monthlyTotal: 800,
  });
  const [horizonMonths, setHorizonMonths] = useState<number>(12);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [projData, infData, monthData] = await Promise.all([
        getFutureProjects(),
        getInflows(),
        getMonthlyContribution(),
      ]);
      setProjects(projData);
      setInflows(infData);
      setMonthlyConfig(monthData);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erreur de chargement des projections"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
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
      const safeTotal = Math.max(0, total);
      const newConfig: MonthlyContributionConfig = {
        monthlyTotal: safeTotal,
      };
      setMonthlyConfig(newConfig);
      await saveMonthlyContribution(newConfig);
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
    reload: load,
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
