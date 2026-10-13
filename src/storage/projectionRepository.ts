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

// ---------------- PROJECTS ----------------

export async function getFutureProjects(
  userId?: string
): Promise<FutureProject[]> {
  try {
    if (!supabase) return [];
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from("future_projects")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      console.error("Failed to load future projects from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapFutureProjectRow);
  } catch (error) {
    console.error("Failed to load future projects from Supabase:", error);
    return [];
  }
}

export async function saveFutureProjects(
  projects: FutureProject[],
  userId?: string
): Promise<void> {
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

  const { error } = await supabase
    .from("future_projects")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to save future projects to Supabase:", error);
    throw error;
  }
}

export async function addFutureProject(
  data: Omit<FutureProject, "id" | "updatedAt">,
  userId?: string
): Promise<FutureProject> {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré");
  }

  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) {
    throw new Error("Utilisateur non authentifié");
  }

  const newId =
    "proj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

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

  if (error || !inserted) {
    console.error("Failed to insert future project into Supabase:", error);
    throw new Error(
      error?.message || "Erreur lors de l'ajout du projet futur"
    );
  }

  return mapFutureProjectRow(inserted);
}

export async function updateFutureProject(
  id: string,
  updates: Partial<Omit<FutureProject, "id">>
): Promise<FutureProject | null> {
  if (!supabase) return null;

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

  if (error || !data) {
    console.error("Failed to update future project in Supabase:", error);
    return null;
  }

  return mapFutureProjectRow(data);
}

export async function toggleFutureProjectActive(
  id: string
): Promise<FutureProject | null> {
  if (!supabase) return null;

  const { data: current, error: getError } = await supabase
    .from("future_projects")
    .select("is_active")
    .eq("id", id)
    .single();

  if (getError || !current) {
    console.error("Failed to fetch future project for toggle:", getError);
    return null;
  }

  return updateFutureProject(id, { isActive: !current.is_active });
}

export async function deleteFutureProject(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("future_projects")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete future project from Supabase:", error);
    throw error;
  }
}

// ---------------- INFLOWS ----------------

export async function getInflows(userId?: string): Promise<OneOffInflow[]> {
  try {
    if (!supabase) return [];
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from("inflows")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      console.error("Failed to load inflows from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapInflowRow);
  } catch (error) {
    console.error("Failed to load inflows from Supabase:", error);
    return [];
  }
}

export async function saveInflows(
  inflows: OneOffInflow[],
  userId?: string
): Promise<void> {
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

  const { error } = await supabase
    .from("inflows")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to save inflows to Supabase:", error);
    throw error;
  }
}

export async function addInflow(
  data: Omit<OneOffInflow, "id" | "updatedAt">,
  userId?: string
): Promise<OneOffInflow> {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré");
  }

  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) {
    throw new Error("Utilisateur non authentifié");
  }

  const newId =
    "inf_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

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

  if (error || !inserted) {
    console.error("Failed to insert inflow into Supabase:", error);
    throw new Error(error?.message || "Erreur lors de l'ajout de la rentrée");
  }

  return mapInflowRow(inserted);
}

export async function updateInflow(
  id: string,
  updates: Partial<Omit<OneOffInflow, "id">>
): Promise<OneOffInflow | null> {
  if (!supabase) return null;

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

  if (error || !data) {
    console.error("Failed to update inflow in Supabase:", error);
    return null;
  }

  return mapInflowRow(data);
}

export async function toggleInflowActive(
  id: string
): Promise<OneOffInflow | null> {
  if (!supabase) return null;

  const { data: current, error: getError } = await supabase
    .from("inflows")
    .select("is_active")
    .eq("id", id)
    .single();

  if (getError || !current) {
    console.error("Failed to fetch inflow for toggle:", getError);
    return null;
  }

  return updateInflow(id, { isActive: !current.is_active });
}

export async function deleteInflow(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("inflows").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete inflow from Supabase:", error);
    throw error;
  }
}

// ---------------- MONTHLY CONTRIBUTION CONFIG ----------------

export async function getMonthlyContribution(
  userId?: string
): Promise<MonthlyContributionConfig> {
  const DEFAULT_CONFIG: MonthlyContributionConfig = { monthlyTotal: 800 };

  try {
    if (!supabase) return DEFAULT_CONFIG;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return DEFAULT_CONFIG;

    const { data, error } = await supabase
      .from("user_settings")
      .select("monthly_savings")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.error(
        "Failed to load monthly contribution from Supabase:",
        error
      );
      return DEFAULT_CONFIG;
    }

    if (!data || data.monthly_savings == null) {
      return DEFAULT_CONFIG;
    }

    return {
      monthlyTotal: Number(data.monthly_savings),
    };
  } catch (error) {
    console.error(
      "Failed to load monthly contribution from Supabase:",
      error
    );
    return DEFAULT_CONFIG;
  }
}

export async function saveMonthlyContribution(
  config: MonthlyContributionConfig,
  userId?: string
): Promise<void> {
  if (!supabase) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: uid,
      monthly_savings: config.monthlyTotal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error(
      "Failed to save monthly contribution to Supabase:",
      error
    );
    throw error;
  }
}
