import { z } from "zod";
import { readStored, writeStored } from "./validatedStorage";
import { savingsSchema, expenseSchema, inflowSchema, contributionSchema, moneySchema, validate } from "../types/validation";
import type { SavingsAccount } from "../types/savingsAccount";
import type { Expense } from "../types/expense";
import type { FutureProject, OneOffInflow, MonthlyContributionConfig } from "../types/projection";

export interface CollectionItems {
  savings_accounts: SavingsAccount;
  expenses: Expense;
  future_projects: FutureProject;
  inflows: OneOffInflow;
}
export type CollectionName = keyof CollectionItems;
export const DEFAULT_SAFETY_CUSHION = 20000;
export const DEFAULT_MONTHLY_CONTRIBUTION = { monthlyTotal: 800 };

// Sérialise uniquement les écritures locales : une requête réseau ne bloque jamais le cache.
function cachedValue<T>(key: string, schema: z.ZodType<T, z.ZodTypeDef, unknown>, fallback: T) {
  let pending: Promise<unknown> = Promise.resolve();
  let revision = 0;
  const unconfirmed = new Map<number, "change" | "delete">();
  const serialize = <R>(operation: () => Promise<R>): Promise<R> => {
    const next = pending.then(operation);
    pending = next.catch(() => undefined);
    return next;
  };
  return {
    version: () => revision,
    acknowledge(expectedVersion: number): void {
      unconfirmed.delete(expectedVersion);
    },
    acknowledgeSnapshot(expectedVersion: number): void {
      // Un upsert de snapshot ne confirme jamais une suppression absente de son payload.
      for (const [version, kind] of unconfirmed) {
        if (version <= expectedVersion && kind === "change") unconfirmed.delete(version);
      }
    },
    parse: (value: unknown): T => validate(schema, value),
    async read(): Promise<T> {
      await pending;
      return readStored(key, schema, fallback);
    },
    change<R>(operation: (current: T) => { value: T; result: R }, kind: "change" | "delete" = "change"): Promise<R> {
      revision += 1;
      unconfirmed.set(revision, kind);
      return serialize(async () => {
        const { value, result } = operation(await readStored(key, schema, fallback));
        await writeStored(key, schema, value);
        return result;
      });
    },
    set(value: T): Promise<void> {
      const parsed = validate(schema, value);
      revision += 1;
      unconfirmed.set(revision, "change");
      return serialize(() => writeStored(key, schema, parsed));
    },
    replaceRemote(value: T, expectedVersion: number, explicitPull = false): Promise<boolean> {
      const parsed = validate(schema, value);
      return serialize(async () => {
        if (revision !== expectedVersion || (unconfirmed.size > 0 && !explicitPull)) return false;
        revision += 1;
        await writeStored(key, schema, parsed);
        if (explicitPull) {
          for (const version of unconfirmed.keys()) {
            if (version <= expectedVersion) unconfirmed.delete(version);
          }
        }
        return true;
      });
    },
  };
}
export type CollectionCache<T> = ReturnType<typeof cachedValue<T[]>>;
export const collectionCaches: { [K in CollectionName]: CollectionCache<CollectionItems[K]> } = {
  savings_accounts: cachedValue<SavingsAccount[]>("@nova_savings_v3", savingsSchema.array(), []),
  expenses: cachedValue<Expense[]>("@nova_expenses_v3", expenseSchema.array(), []),
  future_projects: cachedValue<FutureProject[]>("@nova_future_projects_v3", expenseSchema.array(), []),
  inflows: cachedValue<OneOffInflow[]>("@nova_inflows_v3", inflowSchema.array(), []),
};
export const monthlyCache = cachedValue<MonthlyContributionConfig>("@nova_monthly_contribution_v3", contributionSchema, DEFAULT_MONTHLY_CONTRIBUTION);
export const cushionCache = cachedValue<number>("@nova_safety_cushion_v3", moneySchema, DEFAULT_SAFETY_CUSHION);
