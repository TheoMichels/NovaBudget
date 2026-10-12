import AsyncStorage from "@react-native-async-storage/async-storage";
import { Expense } from "../types/expense";

const STORAGE_KEY = "@novabudget_expenses_v2";

const DEFAULT_EXPENSES: Expense[] = [
  {
    id: "exp_1",
    title: "Voyage été Italie (2 semaines)",
    amount: 2800,
    targetDate: "2026-07",
    category: "voyage",
    isActive: true,
    notes: "Billets, hôtel et activités",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exp_2",
    title: "Changement canapé salon",
    amount: 1600,
    targetDate: "2026-09",
    category: "logement",
    isActive: true,
    notes: "Achat mobilier",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exp_3",
    title: "Taxe Foncière annuelle",
    amount: 2000,
    targetDate: "2026-10",
    category: "fiscalite",
    isActive: true,
    notes: "Prélèvement d'automne",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "exp_4",
    title: "Révision & Contrôle Véhicule",
    amount: 7000,
    targetDate: "2026-11",
    category: "vehicule",
    isActive: true,
    notes: "Entretien et réparations",
    updatedAt: new Date().toISOString(),
  },
];

export async function getExpenses(): Promise<Expense[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_EXPENSES));
      return DEFAULT_EXPENSES;
    }
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : DEFAULT_EXPENSES;
  } catch (error) {
    console.error("Failed to load expenses from storage", error);
    return DEFAULT_EXPENSES;
  }
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  } catch (error) {
    console.error("Failed to save expenses to storage", error);
    throw error;
  }
}

export async function addExpense(
  data: Omit<Expense, "id" | "updatedAt">
): Promise<Expense> {
  const current = await getExpenses();
  const newExpense: Expense = {
    ...data,
    id: "exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newExpense, ...current];
  await saveExpenses(updated);
  return newExpense;
}

export async function updateExpense(
  id: string,
  updates: Partial<Omit<Expense, "id">>
): Promise<Expense | null> {
  const current = await getExpenses();
  const index = current.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const updatedExpense: Expense = {
    ...current[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  current[index] = updatedExpense;
  await saveExpenses(current);
  return updatedExpense;
}

export async function toggleExpenseActive(id: string): Promise<Expense | null> {
  const current = await getExpenses();
  const item = current.find((e) => e.id === id);
  if (!item) return null;
  return updateExpense(id, { isActive: !item.isActive });
}

export async function deleteExpense(id: string): Promise<void> {
  const current = await getExpenses();
  const filtered = current.filter((e) => e.id !== id);
  await saveExpenses(filtered);
}
