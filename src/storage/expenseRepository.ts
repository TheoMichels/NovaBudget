import { expenseSchema, expenseInputSchema, remoteExpenseSchema, validate } from "../types/validation";
import { readStored, writeStored } from "./validatedStorage";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import { ExpenseInsert, ExpenseRow, ExpenseUpdate } from "../types/database";
import { Expense, ExpenseCategory } from "../types/expense";

const STORAGE_KEY = "@novabudget_expenses_v3";

const VALID_CATEGORIES: readonly ExpenseCategory[] = [
  "voyage",
  "logement",
  "vehicule",
  "famille",
  "fiscalite",
  "autre",
];

function sanitizeCategory(cat: string): ExpenseCategory {
  return VALID_CATEGORIES.includes(cat as ExpenseCategory)
    ? (cat as ExpenseCategory)
    : "autre";
}

function mapExpenseRowToExpense(row: ExpenseRow): Expense {
  validate(remoteExpenseSchema, row);
  return {
    id: row.id,
    title: row.title,
    amount: Number(row.amount) || 0,
    targetDate: row.target_date,
    category: sanitizeCategory(row.category),
    isActive: Boolean(row.is_active),
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

async function getLocalExpenses(): Promise<Expense[]> {
  return readStored(STORAGE_KEY, expenseSchema.array(), []);
}

async function saveLocalExpenses(expenses: Expense[]): Promise<void> {
  await writeStored(STORAGE_KEY, expenseSchema.array(), expenses);
}

function isTableMissingError(error: unknown): boolean {
  if (!error) return false;
  const details = typeof error === "object" ? error as { message?: unknown; code?: unknown } : {};
  const msg = typeof error === "string" ? error : typeof details.message === "string" ? details.message : "";
  const code = details.code;
  return (
    code === "PGRST205" ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

export async function getExpenses(userId?: string): Promise<Expense[]> {
  const localExpenses = await getLocalExpenses();
  try {
    if (!supabase) return localExpenses;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localExpenses;

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      if (!isTableMissingError(error)) {
        console.error("Failed to load expenses from Supabase:", error);
      }
      return localExpenses;
    }

    if (!data || data.length === 0) {
      return localExpenses;
    }

    const expenses = data.map(mapExpenseRowToExpense);
    await saveLocalExpenses(expenses);
    return expenses;
  } catch (error) {
    console.warn("Failed to load expenses from Supabase, fallback local:", error);
    return localExpenses;
  }
}

export async function saveExpenses(
  expenses: Expense[],
  userId?: string
): Promise<void> {
  await saveLocalExpenses(expenses);

  if (!supabase || expenses.length === 0) return;
  const sessionRes = await supabase.auth.getSession();
  const uid =
    userId ??
    sessionRes.data?.session?.user?.id ??
    (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: ExpenseInsert[] = expenses.map((e) => ({
    id: e.id,
    user_id: uid,
    title: e.title,
    amount: Number(e.amount) || 0,
    target_date: e.targetDate,
    category: e.category,
    is_active: e.isActive,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from("expenses")
      .upsert(rows, { onConflict: "id" });

    if (error && !isTableMissingError(error)) {
      console.error("Failed to save expenses to Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }
}

export async function addExpense(
  data: Omit<Expense, "id" | "updatedAt">,
  userId?: string
): Promise<Expense> {
  validate(expenseInputSchema, data);
  const newId =
    "exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const localExpense: Expense = {
    ...data,
    id: newId,
    amount: Number(data.amount) || 0,
    updatedAt: new Date().toISOString(),
  };

  // 1. Sauvegarde locale
  const currentLocal = await getLocalExpenses();
  const updatedLocal = [localExpense, ...currentLocal.filter((e) => e.id !== newId)];
  await saveLocalExpenses(updatedLocal);

  // 2. Sauvegarde Supabase si dispo
  if (supabase) {
    try {
      const sessionRes = await supabase.auth.getSession();
      const uid =
        userId ??
        sessionRes.data?.session?.user?.id ??
        (await getCurrentUser())?.id;

      if (uid) {
        const rowInsert: ExpenseInsert = {
          id: newId,
          user_id: uid,
          title: data.title,
          amount: Number(data.amount) || 0,
          target_date: data.targetDate,
          category: data.category,
          is_active: data.isActive,
          notes: data.notes ?? null,
        };

        const { data: inserted, error } = await supabase
          .from("expenses")
          .insert(rowInsert)
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            console.warn("Table expenses manquante sur Supabase. Sauvegarde locale active.");
            return localExpense;
          }
          console.error("Failed to insert expense into Supabase:", error);
          throw new Error(error?.message || "Erreur lors de l'ajout de la dépense");
        }

        if (inserted) {
          const exp = mapExpenseRowToExpense(inserted);
          await saveLocalExpenses([exp, ...currentLocal.filter((e) => e.id !== newId)]);
          return exp;
        }
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        return localExpense;
      }
      throw err;
    }
  }

  return localExpense;
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, "id">>
): Promise<Expense | null> {
  validate(expenseInputSchema.partial(), updates);
  // 1. Mise à jour locale
  const currentLocal = await getLocalExpenses();
  const idx = currentLocal.findIndex((e) => e.id === id);
  let updatedLocal: Expense | null = null;
  if (idx !== -1) {
    updatedLocal = {
      ...currentLocal[idx],
      ...updates,
      amount: updates.amount !== undefined ? Number(updates.amount) || 0 : currentLocal[idx].amount,
      updatedAt: new Date().toISOString(),
    };
    currentLocal[idx] = updatedLocal;
    await saveLocalExpenses(currentLocal);
  }

  // 2. Mise à jour Supabase si dispo
  if (supabase) {
    try {
      const updatePayload: Partial<ExpenseUpdate> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.title !== undefined) updatePayload.title = updates.title;
      if (updates.amount !== undefined)
        updatePayload.amount = Number(updates.amount) || 0;
      if (updates.targetDate !== undefined)
        updatePayload.target_date = updates.targetDate;
      if (updates.category !== undefined)
        updatePayload.category = updates.category;
      if (updates.isActive !== undefined)
        updatePayload.is_active = updates.isActive;
      if (updates.notes !== undefined)
        updatePayload.notes = updates.notes ?? null;

      const { data, error } = await supabase
        .from("expenses")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error("Failed to update expense in Supabase:", error);
        }
        return updatedLocal;
      }

      if (data) {
        const mapped = mapExpenseRowToExpense(data);
        if (idx !== -1) {
          currentLocal[idx] = mapped;
          await saveLocalExpenses(currentLocal);
        }
        return mapped;
      }
    } catch {
      return updatedLocal;
    }
  }

  return updatedLocal;
}

export async function toggleExpenseActive(id: string): Promise<Expense | null> {
  const currentLocal = await getLocalExpenses();
  const exp = currentLocal.find((e) => e.id === id);
  const currentActive = exp ? exp.isActive : true;

  return updateExpense(id, { isActive: !currentActive });
}

export async function deleteExpense(id: string): Promise<void> {
  const currentLocal = await getLocalExpenses();
  await saveLocalExpenses(currentLocal.filter((e) => e.id !== id));

  if (!supabase) return;

  try {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error && !isTableMissingError(error)) {
      console.error("Failed to delete expense from Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }
}
