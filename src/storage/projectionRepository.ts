import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  FutureProject,
  MonthlyContributionConfig,
  OneOffInflow,
} from "../types/projection";

const STORAGE_PROJECTS_KEY = "@novabudget_future_projects_v2";
const STORAGE_INFLOWS_KEY = "@novabudget_inflows_v2";
const STORAGE_MONTHLY_KEY = "@novabudget_monthly_config_v2";

const DEFAULT_PROJECTS: FutureProject[] = [
  {
    id: "proj_car",
    title: "Achat Voiture (Apport)",
    amount: 15000,
    targetDate: "2027-10", // dans 12 mois
    category: "vehicule",
    isActive: true,
    notes: "Apport personnel pour achat véhicule d'occasion récente",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "proj_trip",
    title: "Voyage Japon (Roadtrip 3 semaines)",
    amount: 4500,
    targetDate: "2028-04", // dans 18 mois
    category: "voyage",
    isActive: false,
    notes: "Billets d'avion, hébergements et pass train",
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_INFLOWS: OneOffInflow[] = [
  {
    id: "inf_prime",
    title: "Prime Annuelle Entreprise",
    amount: 3500,
    targetDate: "2026-12", // dans 2 mois
    isActive: true,
    notes: "Versement prime d'intéressement & performance",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "inf_sale",
    title: "Vente Ancien Véhicule",
    amount: 1800,
    targetDate: "2027-04", // dans 6 mois
    isActive: true,
    notes: "Cession de l'ancien deux-roues",
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_MONTHLY_CONFIG: MonthlyContributionConfig = {
  monthlyTotal: 800,
};

// ---------------- PROJECTS ----------------
export async function getFutureProjects(): Promise<FutureProject[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_PROJECTS_KEY);
    if (!json) {
      await AsyncStorage.setItem(
        STORAGE_PROJECTS_KEY,
        JSON.stringify(DEFAULT_PROJECTS)
      );
      return DEFAULT_PROJECTS;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : DEFAULT_PROJECTS;
  } catch (error) {
    console.error("Failed to load future projects from storage", error);
    return DEFAULT_PROJECTS;
  }
}

export async function saveFutureProjects(
  projects: FutureProject[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save future projects", error);
    throw error;
  }
}

export async function addFutureProject(
  data: Omit<FutureProject, "id" | "updatedAt">
): Promise<FutureProject> {
  const current = await getFutureProjects();
  const newProject: FutureProject = {
    ...data,
    id: "proj_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newProject, ...current];
  await saveFutureProjects(updated);
  return newProject;
}

export async function updateFutureProject(
  id: string,
  updates: Partial<Omit<FutureProject, "id">>
): Promise<FutureProject | null> {
  const current = await getFutureProjects();
  const index = current.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const updatedProject: FutureProject = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[index] = updatedProject;
  await saveFutureProjects(current);
  return updatedProject;
}

export async function toggleFutureProjectActive(
  id: string
): Promise<FutureProject | null> {
  const current = await getFutureProjects();
  const item = current.find((p) => p.id === id);
  if (!item) return null;
  return updateFutureProject(id, { isActive: !item.isActive });
}

export async function deleteFutureProject(id: string): Promise<void> {
  const current = await getFutureProjects();
  const filtered = current.filter((p) => p.id !== id);
  await saveFutureProjects(filtered);
}

// ---------------- INFLOWS ----------------
export async function getInflows(): Promise<OneOffInflow[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_INFLOWS_KEY);
    if (!json) {
      await AsyncStorage.setItem(
        STORAGE_INFLOWS_KEY,
        JSON.stringify(DEFAULT_INFLOWS)
      );
      return DEFAULT_INFLOWS;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : DEFAULT_INFLOWS;
  } catch (error) {
    console.error("Failed to load inflows from storage", error);
    return DEFAULT_INFLOWS;
  }
}

export async function saveInflows(inflows: OneOffInflow[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_INFLOWS_KEY, JSON.stringify(inflows));
  } catch (error) {
    console.error("Failed to save inflows", error);
    throw error;
  }
}

export async function addInflow(
  data: Omit<OneOffInflow, "id" | "updatedAt">
): Promise<OneOffInflow> {
  const current = await getInflows();
  const newInflow: OneOffInflow = {
    ...data,
    id: "inf_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newInflow, ...current];
  await saveInflows(updated);
  return newInflow;
}

export async function updateInflow(
  id: string,
  updates: Partial<Omit<OneOffInflow, "id">>
): Promise<OneOffInflow | null> {
  const current = await getInflows();
  const index = current.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updatedInflow: OneOffInflow = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[index] = updatedInflow;
  await saveInflows(current);
  return updatedInflow;
}

export async function toggleInflowActive(
  id: string
): Promise<OneOffInflow | null> {
  const current = await getInflows();
  const item = current.find((i) => i.id === id);
  if (!item) return null;
  return updateInflow(id, { isActive: !item.isActive });
}

export async function deleteInflow(id: string): Promise<void> {
  const current = await getInflows();
  const filtered = current.filter((i) => i.id !== id);
  await saveInflows(filtered);
}

// ---------------- MONTHLY CONTRIBUTION CONFIG ----------------
export async function getMonthlyContribution(): Promise<MonthlyContributionConfig> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_MONTHLY_KEY);
    if (!json) {
      await AsyncStorage.setItem(
        STORAGE_MONTHLY_KEY,
        JSON.stringify(DEFAULT_MONTHLY_CONFIG)
      );
      return DEFAULT_MONTHLY_CONFIG;
    }
    const parsed = JSON.parse(json);
    return parsed && typeof parsed.monthlyTotal === "number"
      ? { monthlyTotal: parsed.monthlyTotal }
      : DEFAULT_MONTHLY_CONFIG;
  } catch (error) {
    console.error("Failed to load monthly config", error);
    return DEFAULT_MONTHLY_CONFIG;
  }
}

export async function saveMonthlyContribution(
  config: MonthlyContributionConfig
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_MONTHLY_KEY, JSON.stringify(config));
  } catch (error) {
    console.error("Failed to save monthly config", error);
    throw error;
  }
}
