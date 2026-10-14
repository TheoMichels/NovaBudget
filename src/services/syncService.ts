import { Expense, ExpenseCategory } from "../types/expense";
import { FutureProject, OneOffInflow } from "../types/projection";
import { SavingsAccount, SavingsCategory } from "../types/savingsAccount";
import {
  ExpenseInsert,
  FutureProjectInsert,
  InflowInsert,
  SavingsAccountInsert,
  UserSettingsInsert,
} from "../types/database";
import { getExpenses, saveExpenses } from "../storage/expenseRepository";
import {
  getFutureProjects,
  getInflows,
  getMonthlyContribution,
  saveFutureProjects,
  saveInflows,
  saveMonthlyContribution,
} from "../storage/projectionRepository";
import { getSavings, saveSavings } from "../storage/savingsRepository";
import { getSafetyCushion, saveSafetyCushion } from "../storage/settingsRepository";
import { supabase } from "./supabaseClient";

export interface SyncResult {
  success: boolean;
  message?: string;
  error?: string;
}

function isTableMissingError(error: any): boolean {
  if (!error) return false;
  const msg = typeof error === "string" ? error : error?.message || "";
  const code = error?.code || "";
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

/**
 * Envoie l'intégralité des données locales (AsyncStorage) vers Supabase pour l'utilisateur connecté.
 */
export async function pushLocalToSupabase(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      error: "Supabase n'est pas configuré. Données conservées localement.",
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Identifiant utilisateur manquant pour la synchronisation.",
    };
  }

  try {
    const [savings, expenses, projects, inflows, cushion, monthly] =
      await Promise.all([
        getSavings(),
        getExpenses(),
        getFutureProjects(),
        getInflows(),
        getSafetyCushion(),
        getMonthlyContribution(),
      ]);

    // 1. Savings Accounts
    if (savings.length > 0) {
      const savingsRows: SavingsAccountInsert[] = savings.map((s) => ({
        id: s.id,
        user_id: userId,
        name: s.name,
        category: s.category,
        amount: s.amount,
        rate: s.rate,
        bank: s.bank ?? null,
        notes: s.notes ?? null,
        updated_at: s.updatedAt,
      }));

      const { error } = await supabase
        .from("savings_accounts")
        .upsert(savingsRows, { onConflict: "id" });
      if (error) {
        if (isTableMissingError(error)) {
          return {
            success: true,
            message: "Table Supabase non initialisée. Données enregistrées en local.",
          };
        }
        throw error;
      }
    }

    // 2. Expenses
    if (expenses.length > 0) {
      const expenseRows: ExpenseInsert[] = expenses.map((e) => ({
        id: e.id,
        user_id: userId,
        title: e.title,
        amount: e.amount,
        target_date: e.targetDate,
        category: e.category,
        is_active: e.isActive,
        notes: e.notes ?? null,
        updated_at: e.updatedAt,
      }));

      const { error } = await supabase
        .from("expenses")
        .upsert(expenseRows, { onConflict: "id" });
      if (error) {
        if (isTableMissingError(error)) {
          return {
            success: true,
            message: "Table Supabase non initialisée. Données enregistrées en local.",
          };
        }
        throw error;
      }
    }

    // 3. Future Projects
    if (projects.length > 0) {
      const projectRows: FutureProjectInsert[] = projects.map((p) => ({
        id: p.id,
        user_id: userId,
        title: p.title,
        amount: p.amount,
        target_date: p.targetDate,
        category: p.category,
        is_active: p.isActive,
        notes: p.notes ?? null,
        updated_at: p.updatedAt,
      }));

      const { error } = await supabase
        .from("future_projects")
        .upsert(projectRows, { onConflict: "id" });
      if (error) {
        if (isTableMissingError(error)) {
          return {
            success: true,
            message: "Table Supabase non initialisée. Données enregistrées en local.",
          };
        }
        throw error;
      }
    }

    // 4. Inflows
    if (inflows.length > 0) {
      const inflowRows: InflowInsert[] = inflows.map((i) => ({
        id: i.id,
        user_id: userId,
        title: i.title,
        amount: i.amount,
        target_date: i.targetDate,
        is_active: i.isActive,
        notes: i.notes ?? null,
        updated_at: i.updatedAt,
      }));

      const { error } = await supabase
        .from("inflows")
        .upsert(inflowRows, { onConflict: "id" });
      if (error) {
        if (isTableMissingError(error)) {
          return {
            success: true,
            message: "Table Supabase non initialisée. Données enregistrées en local.",
          };
        }
        throw error;
      }
    }

    // 5. User Settings
    const settingsRow: UserSettingsInsert = {
      user_id: userId,
      safety_cushion: cushion,
      monthly_savings: monthly.monthlyTotal,
      updated_at: new Date().toISOString(),
    };

    const { error: settingsError } = await supabase
      .from("user_settings")
      .upsert(settingsRow, { onConflict: "user_id" });
    if (settingsError) {
      if (isTableMissingError(settingsError)) {
        return {
          success: true,
          message: "Table Supabase non initialisée. Données enregistrées en local.",
        };
      }
      throw settingsError;
    }

    return {
      success: true,
      message: "Synchronisation montante vers Supabase réussie.",
    };
  } catch (err) {
    if (isTableMissingError(err)) {
      return {
        success: true,
        message: "Tables Supabase non initialisées. Vos données sont conservées localement.",
      };
    }
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'envoi des données";
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Récupère les données depuis Supabase pour l'utilisateur connecté et met à jour le stockage local (AsyncStorage).
 */
export async function pullSupabaseToLocal(userId: string): Promise<SyncResult> {
  if (!supabase) {
    return {
      success: false,
      error: "Supabase n'est pas configuré. Données locales conservées.",
    };
  }

  if (!userId) {
    return {
      success: false,
      error: "Identifiant utilisateur manquant pour le chargement Cloud.",
    };
  }

  try {
    const [
      savingsRes,
      expensesRes,
      projectsRes,
      inflowsRes,
      settingsRes,
    ] = await Promise.all([
      supabase.from("savings_accounts").select("*").eq("user_id", userId),
      supabase.from("expenses").select("*").eq("user_id", userId),
      supabase.from("future_projects").select("*").eq("user_id", userId),
      supabase.from("inflows").select("*").eq("user_id", userId),
      supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const anyMissing = [
      savingsRes.error,
      expensesRes.error,
      projectsRes.error,
      inflowsRes.error,
      settingsRes.error,
    ].some(isTableMissingError);

    if (anyMissing) {
      return {
        success: true,
        message: "Tables Supabase en attente d'initialisation. Mode local actif.",
      };
    }

    if (savingsRes.error) throw savingsRes.error;
    if (expensesRes.error) throw expensesRes.error;
    if (projectsRes.error) throw projectsRes.error;
    if (inflowsRes.error) throw inflowsRes.error;
    if (settingsRes.error) throw settingsRes.error;

    const hasCloudData =
      (savingsRes.data && savingsRes.data.length > 0) ||
      (expensesRes.data && expensesRes.data.length > 0) ||
      (projectsRes.data && projectsRes.data.length > 0) ||
      (inflowsRes.data && inflowsRes.data.length > 0) ||
      Boolean(settingsRes.data);

    // Si le compte Supabase est neuf et ne contient aucune donnée, on synchronise les données locales existantes vers le Cloud
    if (!hasCloudData) {
      return await pushLocalToSupabase(userId);
    }

    // 1. Savings
    if (savingsRes.data) {
      const localSavings: SavingsAccount[] = savingsRes.data.map((r) => ({
        id: r.id,
        name: r.name,
        category: (r.category as SavingsCategory) || "securite",
        amount: Number(r.amount) || 0,
        rate: Number(r.rate) || 0,
        bank: r.bank ?? undefined,
        notes: r.notes ?? undefined,
        updatedAt: r.updated_at || new Date().toISOString(),
      }));
      await saveSavings(localSavings);
    }

    // 2. Expenses
    if (expensesRes.data) {
      const localExpenses: Expense[] = expensesRes.data.map((r) => ({
        id: r.id,
        title: r.title,
        amount: Number(r.amount) || 0,
        targetDate: r.target_date,
        category: (r.category as ExpenseCategory) || "autre",
        isActive: Boolean(r.is_active),
        notes: r.notes ?? undefined,
        updatedAt: r.updated_at || new Date().toISOString(),
      }));
      await saveExpenses(localExpenses);
    }

    // 3. Projects
    if (projectsRes.data) {
      const localProjects: FutureProject[] = projectsRes.data.map((r) => ({
        id: r.id,
        title: r.title,
        amount: Number(r.amount) || 0,
        targetDate: r.target_date,
        category: (r.category as ExpenseCategory) || "autre",
        isActive: Boolean(r.is_active),
        notes: r.notes ?? undefined,
        updatedAt: r.updated_at || new Date().toISOString(),
      }));
      await saveFutureProjects(localProjects);
    }

    // 4. Inflows
    if (inflowsRes.data) {
      const localInflows: OneOffInflow[] = inflowsRes.data.map((r) => ({
        id: r.id,
        title: r.title,
        amount: Number(r.amount) || 0,
        targetDate: r.target_date,
        isActive: Boolean(r.is_active),
        notes: r.notes ?? undefined,
        updatedAt: r.updated_at || new Date().toISOString(),
      }));
      await saveInflows(localInflows);
    }

    // 5. Settings
    if (settingsRes.data) {
      if (typeof settingsRes.data.safety_cushion === "number") {
        await saveSafetyCushion(settingsRes.data.safety_cushion);
      }
      if (typeof settingsRes.data.monthly_savings === "number") {
        await saveMonthlyContribution({
          monthlyTotal: settingsRes.data.monthly_savings,
        });
      }
    }

    return {
      success: true,
      message: "Synchronisation descendante depuis Supabase réussie.",
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors du chargement des données depuis Supabase";
    return {
      success: false,
      error: message,
    };
  }
}
