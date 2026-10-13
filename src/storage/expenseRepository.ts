import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import { ExpenseInsert, ExpenseRow, ExpenseUpdate } from "../types/database";
import { Expense, ExpenseCategory } from "../types/expense";

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

export async function getExpenses(userId?: string): Promise<Expense[]> {
  try {
    if (!supabase) return [];
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("user_id", uid)
      .order("target_date", { ascending: true });

    if (error) {
      console.error("Failed to load expenses from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapExpenseRowToExpense);
  } catch (error) {
    console.error("Failed to load expenses from Supabase:", error);
    return [];
  }
}

export async function saveExpenses(
  expenses: Expense[],
  userId?: string
): Promise<void> {
  if (!supabase || expenses.length === 0) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: ExpenseInsert[] = expenses.map((e) => ({
    id: e.id,
    user_id: uid,
    title: e.title,
    amount: e.amount,
    target_date: e.targetDate,
    category: e.category,
    is_active: e.isActive,
    notes: e.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("expenses")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to save expenses to Supabase:", error);
    throw error;
  }
}

export async function addExpense(
  data: Omit<Expense, "id" | "updatedAt">,
  userId?: string
): Promise<Expense> {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré");
  }

  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) {
    throw new Error("Utilisateur non authentifié");
  }

  const newId =
    "exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const rowInsert: ExpenseInsert = {
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
    .from("expenses")
    .insert(rowInsert)
    .select()
    .single();

  if (error || !inserted) {
    console.error("Failed to insert expense into Supabase:", error);
    throw new Error(error?.message || "Erreur lors de l'ajout de la dépense");
  }

  return mapExpenseRowToExpense(inserted);
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, "id">>
): Promise<Expense | null> {
  if (!supabase) return null;

  const updatePayload: Partial<ExpenseUpdate> = {
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
    .from("expenses")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to update expense in Supabase:", error);
    return null;
  }

  return mapExpenseRowToExpense(data);
}

export async function toggleExpenseActive(id: string): Promise<Expense | null> {
  if (!supabase) return null;

  const { data: current, error: getError } = await supabase
    .from("expenses")
    .select("is_active")
    .eq("id", id)
    .single();

  if (getError || !current) {
    console.error("Failed to fetch expense for toggle:", getError);
    return null;
  }

  return updateExpense(id, { isActive: !current.is_active });
}

export async function deleteExpense(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    console.error("Failed to delete expense from Supabase:", error);
    throw error;
  }
}
