import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { remoteSavingsSchema, remoteExpenseSchema, remoteInflowSchema, remoteSettingsSchema, moneySchema, validate } from "../types/validation";
import type { SavingsAccount } from "../types/savingsAccount";
import type { Expense } from "../types/expense";
import type { OneOffInflow } from "../types/projection";
import type { SavingsAccountInsert, ExpenseInsert, InflowInsert, UserSettingsInsert } from "../types/database";
import { collectionCaches, monthlyCache, cushionCache, DEFAULT_MONTHLY_CONTRIBUTION, DEFAULT_SAFETY_CUSHION, CollectionItems, CollectionName } from "../storage/cacheOnly";
import { getCurrentUser } from "./authService";
import { supabase } from "./supabaseClient";

export interface SyncResult { success: boolean; message?: string; error?: string }
const names: CollectionName[] = ["savings_accounts", "expenses", "future_projects", "inflows"];
const syncError = () => new Error("Synchronisation impossible. Vos modifications sont conservées dans le cache local ; réessayez lorsque la connexion est rétablie.");
const readErrors = new Map<CollectionName | "user_settings", string>();
export function getCloudReadError(name: CollectionName | "user_settings"): string | null {
  return readErrors.get(name) ?? null;
}
const readError = "Chargement distant impossible. Le cache local reste affiché ; vérifiez votre connexion puis réessayez.";
let pendingCloud: Promise<unknown> = Promise.resolve();
// Ordre des commandes partagé par CRUD, push et pull ; aucune dépendance vers les repositories.
function queueCloud<T>(operation: () => Promise<T>): Promise<T> {
  const next = pendingCloud.then(operation);
  pendingCloud = next.catch(() => undefined);
  return next;
}
async function owner(userId?: string): Promise<string> {
  const id = userId ?? (await getCurrentUser())?.id;
  if (!id) throw new Error("Connectez-vous pour synchroniser vos données.");
  return validate(z.string().min(1), id);
}
function checkedOwner(value: unknown, userId: string): void {
  validate(z.object({ user_id: z.literal(userId) }), value);
}
const decode: { [K in CollectionName]: (value: unknown, userId: string) => CollectionItems[K][] } = {
  savings_accounts(value, userId) {
    const rows = validate(remoteSavingsSchema.extend({ user_id: z.literal(userId) }).array(), value);
    return rows.map(row => ({ id: row.id, name: row.name, category: row.category, amount: row.amount, rate: row.rate,
      bank: row.bank ?? undefined, notes: row.notes ?? undefined, updatedAt: row.updated_at ?? "" }));
  },
  expenses(value, userId) { return decodeExpenses(value, userId); },
  future_projects(value, userId) { return decodeExpenses(value, userId); },
  inflows(value, userId) {
    const rows = validate(remoteInflowSchema.extend({ user_id: z.literal(userId) }).array(), value);
    return rows.map(row => ({ id: row.id, title: row.title, amount: row.amount, targetDate: row.target_date,
      isActive: row.is_active, notes: row.notes ?? undefined, updatedAt: row.updated_at ?? "" }));
  },
};
function decodeExpenses(value: unknown, userId: string): Expense[] {
  const rows = validate(remoteExpenseSchema.extend({ user_id: z.literal(userId) }).array(), value);
  return rows.map(row => ({ id: row.id, title: row.title, amount: row.amount, targetDate: row.target_date,
    category: row.category, isActive: row.is_active, notes: row.notes ?? undefined, updatedAt: row.updated_at ?? "" }));
}
function savingsRows(items: SavingsAccount[], userId: string): SavingsAccountInsert[] {
  return items.map(item => ({ id: item.id, user_id: userId, name: item.name, category: item.category, amount: item.amount, rate: item.rate,
    bank: item.bank ?? null, notes: item.notes ?? null, updated_at: item.updatedAt || new Date().toISOString() }));
}
function expenseRows(items: Expense[], userId: string): ExpenseInsert[] {
  return items.map(item => ({ id: item.id, user_id: userId, title: item.title, category: item.category, amount: item.amount,
    target_date: item.targetDate, is_active: item.isActive, notes: item.notes ?? null, updated_at: item.updatedAt || new Date().toISOString() }));
}
function inflowRows(items: OneOffInflow[], userId: string): InflowInsert[] {
  return items.map(item => ({ id: item.id, user_id: userId, title: item.title, amount: item.amount,
    target_date: item.targetDate, is_active: item.isActive, notes: item.notes ?? null, updated_at: item.updatedAt || new Date().toISOString() }));
}
async function sendCollection<K extends CollectionName>(name: K, items: CollectionItems[K][], userId: string): Promise<void> {
  if (!supabase || items.length === 0) return;
  // La validation par table affine le type union avant de construire les Insert générés.
  const response = name === "savings_accounts"
    ? await supabase.from("savings_accounts").upsert(savingsRows(collectionCaches.savings_accounts.parse(items), userId), { onConflict: "id" })
    : name === "inflows"
      ? await supabase.from("inflows").upsert(inflowRows(collectionCaches.inflows.parse(items), userId), { onConflict: "id" })
      : name === "expenses"
        ? await supabase.from("expenses").upsert(expenseRows(collectionCaches.expenses.parse(items), userId), { onConflict: "id" })
        : await supabase.from("future_projects").upsert(expenseRows(collectionCaches.future_projects.parse(items), userId), { onConflict: "id" });
  if (response.error) throw syncError();
}
export async function upsertCloudCollection<K extends CollectionName>(name: K, items: CollectionItems[K][], userId?: string, localVersion?: number): Promise<void> {
  if (!supabase) return;
  const parsed = collectionCaches[name].parse(items);
  try {
    await queueCloud(async () => {
      await sendCollection(name, parsed, await owner(userId));
      if (localVersion !== undefined) collectionCaches[name].acknowledge(localVersion);
    });
  }
  catch { throw syncError(); }
}
export async function deleteCloudItem(name: CollectionName, id: string, localVersion?: number): Promise<void> {
  if (!supabase) return;
  validate(z.string().min(1), id);
  try {
    await queueCloud(async () => {
      const userId = await owner();
      const { error } = await supabase!.from(name).delete().eq("id", id).eq("user_id", userId);
      if (error) throw syncError();
      if (localVersion !== undefined) collectionCaches[name].acknowledge(localVersion);
    });
  } catch { throw syncError(); }
}
let lastPullTimestamp = 0;
let lastPullUserId: string | null = null;
const SYNC_FRESHNESS_TTL_MS = 10000;

export async function readCloudCollection<K extends CollectionName>(name: K, userId?: string): Promise<CollectionItems[K][]> {
  const cache = collectionCaches[name];
  const version = cache.version();
  if (!supabase) return cache.read();
  try {
    const uid = await owner(userId);
    if (lastPullUserId === uid && Date.now() - lastPullTimestamp < SYNC_FRESHNESS_TTL_MS) {
      return cache.read();
    }
    await queueCloud(async () => {
      const { data, error } = await supabase!.from(name as CollectionName).select("*").eq("user_id", uid).order("created_at", { ascending: true });
      if (error) throw syncError();
      const items = decode[name](data, uid);
      await cache.replaceRemote(items, version);
      readErrors.delete(name);
    });
    return cache.read();
  } catch {
    readErrors.set(name, readError);
    return cache.read();
  }
}
const settingsFields = remoteSettingsSchema.extend({ safety_cushion: remoteSettingsSchema.shape.safety_cushion.unwrap().unwrap(), monthly_savings: remoteSettingsSchema.shape.monthly_savings.unwrap().unwrap() });
function decodeSettings(data: unknown, userId: string) {
  if (data === null) return { safety_cushion: DEFAULT_SAFETY_CUSHION, monthly_savings: DEFAULT_MONTHLY_CONTRIBUTION.monthlyTotal };
  checkedOwner(data, userId);
  return validate(settingsFields, data);
}
export async function readCloudSettings(userId?: string): Promise<void> {
  if (!supabase) return;
  const versions = [cushionCache.version(), monthlyCache.version()];
  try {
    const uid = await owner(userId);
    if (lastPullUserId === uid && Date.now() - lastPullTimestamp < SYNC_FRESHNESS_TTL_MS) {
      return;
    }
    await queueCloud(async () => {
      const { data, error } = await supabase!.from("user_settings").select("*").eq("user_id", uid).maybeSingle();
      if (error) throw syncError();
      const settings = decodeSettings(data, uid);
      await cushionCache.replaceRemote(settings.safety_cushion, versions[0]);
      await monthlyCache.replaceRemote({ monthlyTotal: settings.monthly_savings }, versions[1]);
      readErrors.delete("user_settings");
    });
  } catch {
    readErrors.set("user_settings", readError);
  }
}
export async function upsertCloudSettings(settings: Pick<UserSettingsInsert, "safety_cushion" | "monthly_savings">, userId?: string, versions: { cushion?: number; monthly?: number } = {}): Promise<void> {
  const parsed = validate(z.object({ safety_cushion: moneySchema.optional(), monthly_savings: moneySchema.optional() }).refine(value => Object.keys(value).length > 0), settings);
  if (!supabase) return;
  try {
    await queueCloud(async () => {
      const { error } = await supabase!.from("user_settings").upsert({ ...parsed, user_id: await owner(userId), updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw syncError();
      if (versions.cushion !== undefined) cushionCache.acknowledge(versions.cushion);
      if (versions.monthly !== undefined) monthlyCache.acknowledge(versions.monthly);
    });
  } catch { throw syncError(); }
}
export async function pushLocalToSupabase(userId: string): Promise<SyncResult> {
  if (!supabase) return { success: false, error: "Supabase n’est pas configuré. Données locales conservées." };
  try {
    await queueCloud(async () => {
      const uid = await owner(userId);
      const versions = names.map(name => collectionCaches[name].version());
      const settingsVersions = [cushionCache.version(), monthlyCache.version()];
      // Tout le cache est validé avant la première écriture cloud. Aucun getter réseau.
      const [savings, expenses, projects, inflows, cushion, monthly] = await Promise.all([
        collectionCaches.savings_accounts.read(), collectionCaches.expenses.read(), collectionCaches.future_projects.read(),
        collectionCaches.inflows.read(), cushionCache.read(), monthlyCache.read(),
      ]);
      await sendCollection("savings_accounts", savings, uid);
      await sendCollection("expenses", expenses, uid);
      await sendCollection("future_projects", projects, uid);
      await sendCollection("inflows", inflows, uid);
      const { error } = await supabase!.from("user_settings").upsert({ user_id: uid, safety_cushion: cushion, monthly_savings: monthly.monthlyTotal,
        updated_at: new Date().toISOString() }, { onConflict: "user_id" });
      if (error) throw syncError();
      names.forEach((name, index) => collectionCaches[name].acknowledgeSnapshot(versions[index]));
      cushionCache.acknowledgeSnapshot(settingsVersions[0]);
      monthlyCache.acknowledgeSnapshot(settingsVersions[1]);
    });
    return { success: true, message: "Données locales envoyées vers Supabase." };
  } catch { return { success: false, error: syncError().message }; }
}
export async function pullSupabaseToLocal(userId: string): Promise<SyncResult> {
  if (!supabase) return { success: false, error: "Supabase n’est pas configuré. Données locales conservées." };
  const versions = names.map(name => collectionCaches[name].version());
  const settingsVersions = [cushionCache.version(), monthlyCache.version()];
  try {
    await queueCloud(async () => {
      const uid = await owner(userId);
      const responses = await Promise.all(names.map(name => supabase!.from(name as CollectionName).select("*").eq("user_id", uid).order("created_at", { ascending: true })));
      const settingsResponse = await supabase!.from("user_settings").select("*").eq("user_id", uid).maybeSingle();
      if (responses.some(response => response.error) || settingsResponse.error) throw syncError();
      // Valider toutes les réponses avant de remplacer la moindre clé, même si une collection est vide.
      const savings = decode.savings_accounts(responses[0].data, uid);
      const expenses = decode.expenses(responses[1].data, uid);
      const projects = decode.future_projects(responses[2].data, uid);
      const inflows = decode.inflows(responses[3].data, uid);
      const settings = decodeSettings(settingsResponse.data, uid);
      // Une corruption locale doit interrompre le lot avant la première écriture de remplacement.
      await Promise.all([...names.map(name => collectionCaches[name].read()), cushionCache.read(), monthlyCache.read()]);
      const replaced = await Promise.all([
        collectionCaches.savings_accounts.replaceRemote(savings, versions[0], true), collectionCaches.expenses.replaceRemote(expenses, versions[1], true),
        collectionCaches.future_projects.replaceRemote(projects, versions[2], true), collectionCaches.inflows.replaceRemote(inflows, versions[3], true),
        cushionCache.replaceRemote(settings.safety_cushion, settingsVersions[0], true), monthlyCache.replaceRemote({ monthlyTotal: settings.monthly_savings }, settingsVersions[1], true),
      ]);
      if (replaced.some(value => !value)) throw new Error("Des modifications locales récentes ont été conservées. Relancez la synchronisation.");
      lastPullTimestamp = Date.now();
      lastPullUserId = uid;
    });
    return { success: true, message: "Données Supabase chargées dans le cache local." };
  } catch { return { success: false, error: syncError().message }; }
}

export async function pullFromCloud(userId: string): Promise<SyncResult> {
  return pullSupabaseToLocal(userId);
}

export async function clearLocalCache(): Promise<void> {
  const toRemove = new Set<string>();
  const knownPrefixes = [
    "@nova_savings",
    "@nova_expenses",
    "@nova_future_projects",
    "@nova_inflows",
    "@nova_monthly_contribution",
    "@nova_safety_cushion",
    "@novabudget_savings",
    "@novabudget_expenses",
    "@novabudget_future_projects",
    "@novabudget_inflows",
    "@novabudget_monthly_contribution",
    "@novabudget_safety_cushion",
  ];
  const versions = ["_v3", "_v2", "_v1", ""];
  for (const prefix of knownPrefixes) {
    for (const v of versions) {
      toRemove.add(`${prefix}${v}`);
    }
  }

  const asyncStorageAny = AsyncStorage as unknown as {
    getAllKeys?: () => Promise<readonly string[]>;
    multiRemove?: (keys: string[]) => Promise<void>;
    removeMany?: (keys: string[]) => Promise<void>;
    removeItem?: (key: string) => Promise<void>;
  };

  if (typeof asyncStorageAny.getAllKeys === "function") {
    try {
      const allKeys = await asyncStorageAny.getAllKeys();
      for (const k of allKeys) {
        if (k.startsWith("@nova") || k.startsWith("@novabudget")) {
          toRemove.add(k);
        }
      }
    } catch {
      // Ignorer l'erreur d'inspection des clés
    }
  }

  const keysArray = Array.from(toRemove);
  if (typeof asyncStorageAny.multiRemove === "function") {
    try {
      await asyncStorageAny.multiRemove(keysArray);
    } catch {
      await Promise.all(keysArray.map((k) => asyncStorageAny.removeItem?.(k).catch(() => {})));
    }
  } else if (typeof asyncStorageAny.removeMany === "function") {
    try {
      await asyncStorageAny.removeMany(keysArray);
    } catch {
      await Promise.all(keysArray.map((k) => asyncStorageAny.removeItem?.(k).catch(() => {})));
    }
  } else if (typeof asyncStorageAny.removeItem === "function") {
    await Promise.all(keysArray.map((k) => asyncStorageAny.removeItem?.(k).catch(() => {})));
  }

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const webKeysToRemove = new Set<string>();
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && (key.startsWith("@nova") || key.startsWith("@novabudget"))) {
          webKeysToRemove.add(key);
        }
      }
      for (const key of keysArray) {
        if (key.startsWith("@nova") || key.startsWith("@novabudget")) {
          webKeysToRemove.add(key);
        }
      }
      for (const key of webKeysToRemove) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Erreurs localStorage ignorées (quota, navigation privée)
    }
  }

  lastPullTimestamp = 0;
  lastPullUserId = null;
}

