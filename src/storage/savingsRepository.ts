import AsyncStorage from "@react-native-async-storage/async-storage";
import { SavingsAccount } from "../types/savingsAccount";

const STORAGE_KEY = "@novabudget_savings_v3";

const DEFAULT_SAVINGS: SavingsAccount[] = [
  {
    id: "sav_1",
    name: "Livret A",
    category: "securite",
    amount: 15000,
    rate: 3.0,
    bank: "BoursoBank",
    notes: "Épargne de précaution disponible",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sav_2",
    name: "LDDS",
    category: "securite",
    amount: 8400,
    rate: 3.0,
    bank: "BoursoBank",
    notes: "Plafond sécurité",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sav_3",
    name: "PEA (ETF MSCI World)",
    category: "investissement",
    amount: 5000,
    rate: 7.0,
    bank: "Fortuneo",
    notes: "Investissement long terme",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sav_4",
    name: "Compte Épargne",
    category: "securite",
    amount: 12000,
    rate: 3.0,
    bank: "BNP Paribas",
    notes: "Épargne de précaution",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sav_5",
    name: "Assurance-Vie",
    category: "investissement",
    amount: 10350,
    rate: 4.5,
    bank: "Linxea",
    notes: "Fonds euros et ETF",
    updatedAt: new Date().toISOString(),
  },
];

function sanitizeAccounts(accounts: any[]): SavingsAccount[] {
  return accounts.map((acc) => {
    const cleanName = (acc.name || "")
      .replace(/\s*-\s*(Théo|Alio|theo|alio)\s*/gi, "")
      .trim();
    const cleanNotes = acc.notes
      ? acc.notes.replace(/\s*(Théo|Alio|theo|alio)\s*/gi, "").trim()
      : undefined;
    const { owner, ...rest } = acc;
    return {
      ...rest,
      name: cleanName || acc.name,
      notes: cleanNotes,
    };
  });
}

export async function getSavings(): Promise<SavingsAccount[]> {
  try {
    let json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) {
      // Check migration from v2
      const oldJson = await AsyncStorage.getItem("@novabudget_savings_v2");
      if (oldJson) {
        try {
          const oldParsed = JSON.parse(oldJson);
          if (Array.isArray(oldParsed)) {
            const sanitized = sanitizeAccounts(oldParsed);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
            return sanitized;
          }
        } catch {}
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SAVINGS));
      return DEFAULT_SAVINGS;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? sanitizeAccounts(parsed) : DEFAULT_SAVINGS;
  } catch (error) {
    console.error("Failed to load savings from storage", error);
    return DEFAULT_SAVINGS;
  }
}

export async function saveSavings(accounts: SavingsAccount[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
  } catch (error) {
    console.error("Failed to save savings to storage", error);
    throw error;
  }
}

export async function addSavings(
  data: Omit<SavingsAccount, "id" | "updatedAt">
): Promise<SavingsAccount> {
  const current = await getSavings();
  const newAccount: SavingsAccount = {
    ...data,
    id: "sav_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newAccount, ...current];
  await saveSavings(updated);
  return newAccount;
}

export async function updateSavings(
  id: string,
  updates: Partial<Omit<SavingsAccount, "id">>
): Promise<SavingsAccount | null> {
  const current = await getSavings();
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updatedAccount: SavingsAccount = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[index] = updatedAccount;
  await saveSavings(current);
  return updatedAccount;
}

export async function deleteSavings(id: string): Promise<void> {
  const current = await getSavings();
  const filtered = current.filter((a) => a.id !== id);
  await saveSavings(filtered);
}
