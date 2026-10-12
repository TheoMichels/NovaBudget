export type ExpenseCategory = "voyage" | "logement" | "vehicule" | "famille" | "fiscalite" | "autre";

export interface Expense {
  id: string;
  title: string;
  amount: number;
  targetDate: string; // e.g. "2026-06"
  category: ExpenseCategory;
  isActive: boolean; // included in simulation or paused
  notes?: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  voyage: "Voyage & Vacances",
  logement: "Logement & Travaux",
  vehicule: "Véhicule & Transport",
  famille: "Événement & Famille",
  fiscalite: "Impôts & Fiscalité",
  autre: "Autre Dépense",
};
