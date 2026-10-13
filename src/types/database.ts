export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==========================================
// 1. Savings Accounts (Comptes d'épargne)
// ==========================================
export type SavingsAccountRow = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  rate: number;
  bank: string | null;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

export type SavingsAccountInsert = {
  id?: string;
  user_id: string;
  name: string;
  category: string;
  amount: number;
  rate?: number;
  bank?: string | null;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type SavingsAccountUpdate = {
  id?: string;
  user_id?: string;
  name?: string;
  category?: string;
  amount?: number;
  rate?: number;
  bank?: string | null;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

// ==========================================
// 2. Expenses (Dépenses à venir / CT)
// ==========================================
export type ExpenseRow = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  category: string;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

export type ExpenseInsert = {
  id?: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  category?: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type ExpenseUpdate = {
  id?: string;
  user_id?: string;
  title?: string;
  amount?: number;
  target_date?: string;
  category?: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

// ==========================================
// 3. Future Projects (Projets futurs / MT-LT)
// ==========================================
export type FutureProjectRow = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  category: string;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

export type FutureProjectInsert = {
  id?: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  category?: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type FutureProjectUpdate = {
  id?: string;
  user_id?: string;
  title?: string;
  amount?: number;
  target_date?: string;
  category?: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

// ==========================================
// 4. Inflows (Rentrées financières exceptionnelles)
// ==========================================
export type InflowRow = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  is_active: boolean;
  notes: string | null;
  updated_at: string;
  created_at: string;
};

export type InflowInsert = {
  id?: string;
  user_id: string;
  title: string;
  amount: number;
  target_date: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

export type InflowUpdate = {
  id?: string;
  user_id?: string;
  title?: string;
  amount?: number;
  target_date?: string;
  is_active?: boolean;
  notes?: string | null;
  updated_at?: string;
  created_at?: string;
};

// ==========================================
// 5. User Settings (Paramètres de l'utilisateur)
// ==========================================
export type UserSettingsRow = {
  id: string;
  user_id: string;
  safety_cushion: number;
  monthly_savings: number;
  updated_at: string;
  created_at: string;
};

export type UserSettingsInsert = {
  id?: string;
  user_id: string;
  safety_cushion?: number;
  monthly_savings?: number;
  updated_at?: string;
  created_at?: string;
};

export type UserSettingsUpdate = {
  id?: string;
  user_id?: string;
  safety_cushion?: number;
  monthly_savings?: number;
  updated_at?: string;
  created_at?: string;
};

// ==========================================
// Main Supabase Database Schema
// ==========================================
export type Database = {
  public: {
    Tables: {
      savings_accounts: {
        Row: SavingsAccountRow;
        Insert: SavingsAccountInsert;
        Update: SavingsAccountUpdate;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: ExpenseInsert;
        Update: ExpenseUpdate;
        Relationships: [];
      };
      future_projects: {
        Row: FutureProjectRow;
        Insert: FutureProjectInsert;
        Update: FutureProjectUpdate;
        Relationships: [];
      };
      inflows: {
        Row: InflowRow;
        Insert: InflowInsert;
        Update: InflowUpdate;
        Relationships: [];
      };
      user_settings: {
        Row: UserSettingsRow;
        Insert: UserSettingsInsert;
        Update: UserSettingsUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
