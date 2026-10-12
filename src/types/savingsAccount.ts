export type SavingsCategory = "securite" | "projet" | "investissement";

export interface SavingsAccount {
  id: string;
  name: string;
  category: SavingsCategory;
  amount: number;
  rate: number; // e.g. 3.0 for 3%
  bank?: string;
  notes?: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<SavingsCategory, string> = {
  securite: "Épargne de Sécurité",
  projet: "Projets & Moyen Terme",
  investissement: "Investissement & Long Terme",
};
