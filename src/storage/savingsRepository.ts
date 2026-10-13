import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";
import {
  SavingsAccountInsert,
  SavingsAccountRow,
  SavingsAccountUpdate,
} from "../types/database";
import { SavingsAccount, SavingsCategory } from "../types/savingsAccount";

const STORAGE_KEY = "@novabudget_savings_v3";

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

async function getLocalSavings(): Promise<SavingsAccount[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveLocalSavings(accounts: SavingsAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("Failed to save savings to local storage:", error);
  }
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

export async function getSavings(userId?: string): Promise<SavingsAccount[]> {
  const localAccounts = await getLocalSavings();
  try {
    if (!supabase) return localAccounts;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localAccounts;

    const { data, error } = await supabase
      .from("savings_accounts")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase savings_accounts non trouvée (fallback local actif)"
        );
      } else {
        console.error("Failed to load savings accounts from Supabase:", error);
      }
      return localAccounts;
    }

    if (!data || data.length === 0) {
      return localAccounts;
    }

    const accounts = data.map(mapSavingsRowToAccount);
    await saveLocalSavings(accounts);
    return accounts;
  } catch (error) {
    console.warn("Failed to load savings from Supabase, fallback local:", error);
    return localAccounts;
  }
}

export async function saveSavings(
  accounts: SavingsAccount[],
  userId?: string
): Promise<void> {
  await saveLocalSavings(accounts);

  if (!supabase || accounts.length === 0) return;
  const sessionRes = await supabase.auth.getSession();
  const uid =
    userId ??
    sessionRes.data?.session?.user?.id ??
    (await getCurrentUser())?.id;
  if (!uid) return;

  const rows: SavingsAccountInsert[] = accounts.map((s) => ({
    id: s.id,
    user_id: uid,
    name: s.name,
    category: s.category,
    amount: Number(s.amount) || 0,
    rate: Number(s.rate) || 0,
    bank: s.bank ?? null,
    notes: s.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  try {
    const { error } = await supabase
      .from("savings_accounts")
      .upsert(rows, { onConflict: "id" });

    if (error) {
      if (isTableMissingError(error)) {
        console.warn(
          "Table Supabase savings_accounts non configurée, données enregistrées localement."
        );
        return;
      }
      console.error("Failed to save savings accounts to Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (isTableMissingError(err)) {
      console.warn("Table non trouvée sur Supabase, sauvegarde locale confirmée.");
      return;
    }
    throw err;
  }
}

export async function addSavings(
  data: Omit<SavingsAccount, "id" | "updatedAt">,
  userId?: string
): Promise<SavingsAccount> {
  const newId =
    "sav_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6);

  const localAccount: SavingsAccount = {
    ...data,
    id: newId,
    amount: Number(data.amount) || 0,
    rate: Number(data.rate) || 0,
    updatedAt: new Date().toISOString(),
  };

  // 1. Sauvegarde locale immédiate (garantie zéro perte)
  const currentLocal = await getLocalSavings();
  const updatedLocal = [localAccount, ...currentLocal.filter((a) => a.id !== newId)];
  await saveLocalSavings(updatedLocal);

  // 2. Si Supabase est configuré, tenter l'enregistrement Cloud
  if (supabase) {
    try {
      const sessionRes = await supabase.auth.getSession();
      const uid =
        userId ??
        sessionRes.data?.session?.user?.id ??
        (await getCurrentUser())?.id;

      if (uid) {
        const rowInsert: SavingsAccountInsert = {
          id: newId,
          user_id: uid,
          name: data.name,
          category: data.category,
          amount: Number(data.amount) || 0,
          rate: Number(data.rate) || 0,
          bank: data.bank ?? null,
          notes: data.notes ?? null,
        };

        const { data: inserted, error } = await supabase
          .from("savings_accounts")
          .insert(rowInsert)
          .select()
          .single();

        if (error) {
          if (isTableMissingError(error)) {
            console.warn(
              "Table Supabase savings_accounts non trouvée. Compte sauvegardé localement."
            );
            return localAccount;
          }
          console.error("Failed to insert savings account into Supabase:", error);
          throw new Error(
            error?.message || "Erreur lors de l'ajout du compte d'épargne"
          );
        }

        if (inserted) {
          const account = mapSavingsRowToAccount(inserted);
          await saveLocalSavings([account, ...currentLocal.filter((a) => a.id !== newId)]);
          return account;
        }
      }
    } catch (err) {
      if (isTableMissingError(err)) {
        console.warn("Table manquante sur Supabase. Utilisation du stockage local.");
        return localAccount;
      }
      throw err;
    }
  }

  return localAccount;
}

export async function updateSavings(
  id: string,
  updates: Partial<Omit<SavingsAccount, "id">>
): Promise<SavingsAccount | null> {
  // 1. Mise à jour locale
  const currentLocal = await getLocalSavings();
  const idx = currentLocal.findIndex((a) => a.id === id);
  let updatedLocalAccount: SavingsAccount | null = null;
  if (idx !== -1) {
    updatedLocalAccount = {
      ...currentLocal[idx],
      ...updates,
      amount:
        updates.amount !== undefined
          ? Number(updates.amount) || 0
          : currentLocal[idx].amount,
      rate:
        updates.rate !== undefined
          ? Number(updates.rate) || 0
          : currentLocal[idx].rate,
      updatedAt: new Date().toISOString(),
    };
    currentLocal[idx] = updatedLocalAccount;
    await saveLocalSavings(currentLocal);
  }

  // 2. Mise à jour Supabase si disponible
  if (supabase) {
    try {
      const updatePayload: Partial<SavingsAccountUpdate> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name !== undefined) updatePayload.name = updates.name;
      if (updates.category !== undefined)
        updatePayload.category = updates.category;
      if (updates.amount !== undefined)
        updatePayload.amount = Number(updates.amount) || 0;
      if (updates.rate !== undefined)
        updatePayload.rate = Number(updates.rate) || 0;
      if (updates.bank !== undefined) updatePayload.bank = updates.bank ?? null;
      if (updates.notes !== undefined)
        updatePayload.notes = updates.notes ?? null;

      const { data, error } = await supabase
        .from("savings_accounts")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if (!isTableMissingError(error)) {
          console.error("Failed to update savings account in Supabase:", error);
        }
        return updatedLocalAccount;
      }

      if (data) {
        const mapped = mapSavingsRowToAccount(data);
        if (idx !== -1) {
          currentLocal[idx] = mapped;
          await saveLocalSavings(currentLocal);
        }
        return mapped;
      }
    } catch {
      return updatedLocalAccount;
    }
  }

  return updatedLocalAccount;
}

export async function deleteSavings(id: string): Promise<void> {
  const currentLocal = await getLocalSavings();
  await saveLocalSavings(currentLocal.filter((a) => a.id !== id));

  if (!supabase) return;

  try {
    const { error } = await supabase
      .from("savings_accounts")
      .delete()
      .eq("id", id);

    if (error && !isTableMissingError(error)) {
      console.error("Failed to delete savings account from Supabase:", error);
      throw error;
    }
  } catch (err) {
    if (!isTableMissingError(err)) {
      throw err;
    }
  }
}

