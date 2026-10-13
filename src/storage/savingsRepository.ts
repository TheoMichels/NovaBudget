import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import {
  SavingsAccountInsert,
  SavingsAccountRow,
  SavingsAccountUpdate,
} from "../types/database";
import { SavingsAccount, SavingsCategory } from "../types/savingsAccount";

const VALID_SAVINGS_CATEGORIES: readonly SavingsCategory[] = [
  "securite",
  "projet",
  "investissement",
];

function sanitizeCategory(cat: string): SavingsCategory {
  return VALID_SAVINGS_CATEGORIES.includes(cat as SavingsCategory)
    ? (cat as SavingsCategory)
    : "securite";
}

function mapSavingsRowToAccount(row: SavingsAccountRow): SavingsAccount {
  return {
    id: row.id,
    name: row.name,
    category: sanitizeCategory(row.category),
    amount: Number(row.amount) || 0,
    rate: Number(row.rate) || 0,
    bank: row.bank ?? undefined,
    notes: row.notes ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function getSavings(userId?: string): Promise<SavingsAccount[]> {
  try {
    if (!supabase) return [];
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return [];

    const { data, error } = await supabase
      .from("savings_accounts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Failed to load savings accounts from Supabase:", error);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map(mapSavingsRowToAccount);
  } catch (error) {
    console.error("Failed to load savings accounts from Supabase:", error);
    return [];
  }
}

export async function saveSavings(
  accounts: SavingsAccount[],
  userId?: string
): Promise<void> {
  if (!supabase || accounts.length === 0) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: SavingsAccountInsert[] = accounts.map((s) => ({
    id: s.id,
    user_id: uid,
    name: s.name,
    category: s.category,
    amount: s.amount,
    rate: s.rate,
    bank: s.bank ?? null,
    notes: s.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("savings_accounts")
    .upsert(rows, { onConflict: "id" });

  if (error) {
    console.error("Failed to save savings accounts to Supabase:", error);
    throw error;
  }
}

export async function addSavings(
  data: Omit<SavingsAccount, "id" | "updatedAt">,
  userId?: string
): Promise<SavingsAccount> {
  if (!supabase) {
    throw new Error("Supabase n'est pas configuré");
  }

  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) {
    throw new Error("Utilisateur non authentifié");
  }

  const newId =
    "sav_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const rowInsert: SavingsAccountInsert = {
    id: newId,
    user_id: uid,
    name: data.name,
    category: data.category,
    amount: data.amount,
    rate: data.rate,
    bank: data.bank ?? null,
    notes: data.notes ?? null,
  };

  const { data: inserted, error } = await supabase
    .from("savings_accounts")
    .insert(rowInsert)
    .select()
    .single();

  if (error || !inserted) {
    console.error("Failed to insert savings account into Supabase:", error);
    throw new Error(
      error?.message || "Erreur lors de l'ajout du compte d'épargne"
    );
  }

  return mapSavingsRowToAccount(inserted);
}

export async function updateSavings(
  id: string,
  updates: Partial<Omit<SavingsAccount, "id">>
): Promise<SavingsAccount | null> {
  if (!supabase) return null;

  const updatePayload: Partial<SavingsAccountUpdate> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.category !== undefined)
    updatePayload.category = updates.category;
  if (updates.amount !== undefined) updatePayload.amount = updates.amount;
  if (updates.rate !== undefined) updatePayload.rate = updates.rate;
  if (updates.bank !== undefined) updatePayload.bank = updates.bank ?? null;
  if (updates.notes !== undefined)
    updatePayload.notes = updates.notes ?? null;

  const { data, error } = await supabase
    .from("savings_accounts")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    console.error("Failed to update savings account in Supabase:", error);
    return null;
  }

  return mapSavingsRowToAccount(data);
}

export async function deleteSavings(id: string): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase
    .from("savings_accounts")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Failed to delete savings account from Supabase:", error);
    throw error;
  }
}
