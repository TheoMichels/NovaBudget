import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import {
  FutureProjectInsert,
  FutureProjectRow,
  FutureProjectUpdate,
  InflowInsert,
  InflowRow,
  InflowUpdate,
} from "../types/database";
import { ExpenseCategory } from "../types/expense";
import {
  FutureProject,
  MonthlyContributionConfig,
  OneOffInflow,
} from "../types/projection";

const STORAGE_KEY_PROJECTS = "@novabudget_future_projects_v3";
const STORAGE_KEY_INFLOWS = "@novabudget_inflows_v3";
const STORAGE_KEY_CONTRIBUTION = "@novabudget_monthly_contribution_v3";

const VALID_CATEGORIES: readonly ExpenseCategory[] = [
  "voyage",
  "logement",
  "vehicule",
  "famille",
  "fiscalite",
  "autre",
];

function sanitizeExpenseCategory(cat: string): ExpenseCategory {
  return VALID_CATEGORIES.includes(cat as ExpenseCategory)
    ? (cat as ExpenseCategory)
    : "autre";
}

function mapFutureProjectRow(row: FutureProjectRow): FutureProject {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    targetDate: row.target_date,
    category: sanitizeExpenseCategory(row.category),
    isActive: Boolean(row.is_active),
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function mapInflowRow(row: InflowRow): OneOffInflow {
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    targetDate: row.target_date,
    isActive: Boolean(row.is_active),
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error?.message || "";
  const code = error?.code || "";
  return (
    code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

// ---------------- LOCAL STORAGE HELPERS ----------------

async function getLocalProjects(): Promise<FutureProject[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalProjects(projects: FutureProject[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save future projects to local storage:", error);
  }
}

async function getLocalInflows(): Promise<OneOffInflow[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_INFLOWS);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalInflows(inflows: OneOffInflow[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_INFLOWS, JSON.stringify(inflows));
  } catch (error) {
    console.error("Failed to save inflows to local storage:", error);
  }
}

// ---------------- PROJECTS ----------------

export async function getFutureProjects(
  userId?: string
): Promise<FutureProject[]> {
  const localProjects = await getLocalProjects();
  try {
    if (!supabase) return localProjects;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localProjects;

    const { data, error } = await supabase
      .from("future_projects")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase future_projects non trouvée (fallback local actif)"
        );
      } else {
        console.error("Failed to load future projects from Supabase:", error);
      }
      return localProjects;
    }

    if (!data || data.length === 0) {
      return localProjects;
    }

    const projects = data.map(mapFutureProjectRow);
    await saveLocalProjects(projects);
    return projects;
  } catch (error) {
    console.warn("Failed to load future projects from Supabase, fallback local:", error);
    return localProjects;
  }
}

export async function saveFutureProjects(
  projects: FutureProject[],
  userId?: string
): Promise<void> {
  await saveLocalProjects(projects);

  if (!supabase || projects.length === 0) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: FutureProjectInsert[] = projects.map((p) => ({
    id: p.id,
    user_id: uid,
    title: p.title,
    amount: p.amount,
    target_date: p.targetDate,
    category: p.category,
    is_active: p.isActive,
    notes: p.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from("future_projects")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase future_projects non configurée, sauvegarde locale active."
        );
        return;
      }
      console.error("Failed to save future projects to Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (isTableMissingError(err)) return;
    throw err;
  }
}

export async function addFutureProject(
  data: Omit<FutureProject, "id" | "updatedAt">,
  userId?: string
): Promise<FutureProject> {
  const newId =
    "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const localProject: FutureProject = {
    ...data,
    id: newId,
    amount: Number(data.amount) || 0,
    updatedAt: new Date().toISOString(),
  };

  const currentLocal = await getLocalProjects();
  const updatedLocal = [...currentLocal, localProject];
  await saveLocalProjects(updatedLocal);

  if (supabase) {
    try {
      const uid = userId ?? (await getCurrentUser())?.id;
      if (uid) {
        const rowInsert: FutureProjectInsert = {
          id: newId,
          user_id: uid,
          title: data.title,
          amount: data.amount,
          target_date: data.targetDate,
          category: data.category,
          is_active: data.isActive,
          notes: data.notes ?? null,
        };

        const { data: inserted, error } = await supabase
          .from("future_projects")
          .insert(rowInsert)
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            console.warn(
              "Table Supabase future_projects non trouvée. Projet sauvegardé localement."
            );
            return localProject;
          }
          console.error("Failed to insert future project into Supabase:", error);
          throw new Error(
            error?.message || "Erreur lors de l'ajout du projet futur"
          );
        }

        if (inserted) {
          const mapped = mapFutureProjectRow(inserted);
          await saveLocalProjects([
            ...currentLocal.filter((p) => p.id !== newId),
            mapped,
          ]);
          return mapped;
        }
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        return localProject;
      }
      throw err;
    }
  }

  return localProject;
}

export async function updateFutureProject(
  id: string,
  updates: Partial<Omit<FutureProject, "id">>
): Promise<FutureProject | null> {
  const currentLocal = await getLocalProjects();
  const idx = currentLocal.findIndex((p) => p.id === id);
  let updatedLocal: FutureProject | null = null;

  if (idx !== -1) {
    updatedLocal = {
      ...currentLocal[idx],
      ...updates,
      amount:
        updates.amount !== undefined
          ? Number(updates.amount) || 0
          : currentLocal[idx].amount,
      updatedAt: new Date().toISOString(),
    };
    currentLocal[idx] = updatedLocal;
    await saveLocalProjects(currentLocal);
  }

  if (supabase) {
    try {
      const updatePayload: Partial<FutureProjectUpdate> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updatePayload.title = updates.title;
      if (updates.amount !== undefined) updatePayload.amount = updates.amount;
      if (updates.targetDate !== undefined)
        updatePayload.target_date = updates.targetDate;
      if (updates.category !== undefined)
        updatePayload.category = updates.category;
      if (updates.isActive !== undefined)
        updatePayload.is_active = updates.isActive;
      if (updates.notes !== undefined)
        updatePayload.notes = updates.notes ?? null;

      const { data, error } = await supabase
        .from("future_projects")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error("Failed to update future project in Supabase:", error);
        }
        return updatedLocal;
      }

      if (data) {
        const mapped = mapFutureProjectRow(data);
        if (idx !== -1) {
          currentLocal[idx] = mapped;
          await saveLocalProjects(currentLocal);
        }
        return mapped;
      }
    } catch {
      return updatedLocal;
    }
  }

  return updatedLocal;
}

export async function toggleFutureProjectActive(
  id: string
): Promise<FutureProject | null> {
  const currentLocal = await getLocalProjects();
  const project = currentLocal.find((p) => p.id === id);
  if (!project) return null;
  return updateFutureProject(id, { isActive: !project.isActive });
}

export async function deleteFutureProject(id: string): Promise<void> {
  const currentLocal = await getLocalProjects();
  await saveLocalProjects(currentLocal.filter((p) => p.id !== id));

  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("future_projects")
      .delete()
      .eq("id", id);

    if (error && !isTableMissingError(error)) {
      console.error("Failed to delete future project from Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }
}

// ---------------- INFLOWS ----------------

export async function getInflows(userId?: string): Promise<OneOffInflow[]> {
  const localInflows = await getLocalInflows();
  try {
    if (!supabase) return localInflows;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localInflows;

    const { data, error } = await supabase
      .from("inflows")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase inflows non trouvée (fallback local actif)"
        );
      } else {
        console.error("Failed to load inflows from Supabase:", error);
      }
      return localInflows;
    }

    if (!data || data.length === 0) {
      return localInflows;
    }

    const mapped = data.map(mapInflowRow);
    await saveLocalInflows(mapped);
    return mapped;
  } catch (error) {
    console.warn("Failed to load inflows from Supabase, fallback local:", error);
    return localInflows;
  }
}

export async function saveInflows(
  inflows: OneOffInflow[],
  userId?: string
): Promise<void> {
  await saveLocalInflows(inflows);

  if (!supabase || inflows.length === 0) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: InflowInsert[] = inflows.map((i) => ({
    id: i.id,
    user_id: uid,
    title: i.title,
    amount: i.amount,
    target_date: i.targetDate,
    is_active: i.isActive,
    notes: i.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from("inflows")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase inflows non configurée, sauvegarde locale active."
        );
        return;
      }
      console.error("Failed to save inflows to Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (isTableMissingError(err)) return;
    throw err;
  }
}

export async function addInflow(
  data: Omit<OneOffInflow, "id" | "updatedAt">,
  userId?: string
): Promise<OneOffInflow> {
  const newId =
    "inf_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const localInflow: OneOffInflow = {
    ...data,
    id: newId,
    amount: Number(data.amount) || 0,
    updatedAt: new Date().toISOString(),
  };

  const currentLocal = await getLocalInflows();
  const updatedLocal = [...currentLocal, localInflow];
  await saveLocalInflows(updatedLocal);

  if (supabase) {
    try {
      const uid = userId ?? (await getCurrentUser())?.id;
      if (uid) {
        const rowInsert: InflowInsert = {
          id: newId,
          user_id: uid,
          title: data.title,
          amount: data.amount,
          target_date: data.targetDate,
          is_active: data.isActive,
          notes: data.notes ?? null,
        };

        const { data: inserted, error } = await supabase
          .from("inflows")
          .insert(rowInsert)
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            console.warn(
              "Table Supabase inflows non trouvée. Rentrée sauvegardée localement."
            );
            return localInflow;
          }
          console.error("Failed to insert inflow into Supabase:", error);
          throw new Error(error?.message || "Erreur lors de l'ajout de la rentrée");
        }

        if (inserted) {
          const mapped = mapInflowRow(inserted);
          await saveLocalInflows([
            ...currentLocal.filter((i) => i.id !== newId),
            mapped,
          ]);
          return mapped;
        }
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        return localInflow;
      }
      throw err;
    }
  }

  return localInflow;
}

export async function updateInflow(
  id: string,
  updates: Partial<Omit<OneOffInflow, "id">>
): Promise<OneOffInflow | null> {
  const currentLocal = await getLocalInflows();
  const idx = currentLocal.findIndex((i) => i.id === id);
  let updatedLocal: OneOffInflow | null = null;

  if (idx !== -1) {
    updatedLocal = {
      ...currentLocal[idx],
      ...updates,
      amount:
        updates.amount !== undefined
          ? Number(updates.amount) || 0
          : currentLocal[idx].amount,
      updatedAt: new Date().toISOString(),
    };
    currentLocal[idx] = updatedLocal;
    await saveLocalInflows(currentLocal);
  }

  if (supabase) {
    try {
      const updatePayload: Partial<InflowUpdate> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updatePayload.title = updates.title;
      if (updates.amount !== undefined) updatePayload.amount = updates.amount;
      if (updates.targetDate !== undefined)
        updatePayload.target_date = updates.targetDate;
      if (updates.isActive !== undefined)
        updatePayload.is_active = updates.isActive;
      if (updates.notes !== undefined)
        updatePayload.notes = updates.notes ?? null;

      const { data, error } = await supabase
        .from("inflows")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error("Failed to update inflow in Supabase:", error);
        }
        return updatedLocal;
      }

      if (data) {
        const mapped = mapInflowRow(data);
        if (idx !== -1) {
          currentLocal[idx] = mapped;
          await saveLocalInflows(currentLocal);
        }
        return mapped;
      }
    } catch {
      return updatedLocal;
    }
  }

  return updatedLocal;
}

export async function toggleInflowActive(
  id: string
): Promise<OneOffInflow | null> {
  const currentLocal = await getLocalInflows();
  const inflow = currentLocal.find((i) => i.id === id);
  if (!inflow) return null;
  return updateInflow(id, { isActive: !inflow.isActive });
}

export async function deleteInflow(id: string): Promise<void> {
  const currentLocal = await getLocalInflows();
  await saveLocalInflows(currentLocal.filter((i) => i.id !== id));

  if (!supabase) return;

  try {
    const { error } = await supabase.from("inflows").delete().eq("id", id);

    if (error && !isTableMissingError(error)) {
      console.error("Failed to delete inflow from Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }
}

// ---------------- MONTHLY CONTRIBUTION CONFIG ----------------

export async function getMonthlyContribution(
  userId?: string
): Promise<MonthlyContributionConfig> {
  const DEFAULT_CONFIG: MonthlyContributionConfig = { monthlyTotal: 800 };

  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY_CONTRIBUTION);
    let localConfig = DEFAULT_CONFIG;
    if (json) {
      const parsed = JSON.parse(json);
      if (typeof parsed?.monthlyTotal === "number") {
        localConfig = parsed;
      }
    }

    if (!supabase) return localConfig;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localConfig;

    const { data, error } = await supabase
      .from("user_settings")
      .select("monthly_savings")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table user_settings non trouvée (fallback local contribution actif)"
        );
      } else {
        console.error(
          "Failed to load monthly contribution from Supabase:",
          error
        );
      }
      return localConfig;
    }

    if (!data || data.monthly_savings == null) {
      return localConfig;
    }

    const config = {
      monthlyTotal: Number(data.monthly_savings),
    };
    await AsyncStorage.setItem(
      STORAGE_KEY_CONTRIBUTION,
      JSON.stringify(config)
    );
    return config;
  } catch (error) {
    console.warn(
      "Failed to load monthly contribution, fallback local:",
      error
    );
    return DEFAULT_CONFIG;
  }
}

export async function saveMonthlyContribution(
  config: MonthlyContributionConfig,
  userId?: string
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY_CONTRIBUTION,
      JSON.stringify(config)
    );
  } catch (e) {
    console.error("Failed to save monthly contribution locally:", e);
  }

  if (!supabase) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  try {
    const { error } = await supabase.from("user_settings").upsert(
      {
        user_id: uid,
        monthly_savings: config.monthlyTotal,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      if (isTableMissingError(error)) {
        console.warn("Table user_settings absente, contribution sauvegardée localement.");
        return;
      }
      console.error(
        "Failed to save monthly contribution to Supabase:",
        error
      );
      throw error;
    }
  } catch (err) {
    if (isTableMissingError(err)) return;
    throw err;
  }
}
