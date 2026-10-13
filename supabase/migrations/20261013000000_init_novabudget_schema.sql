-- ==============================================================================
-- Migration: 20261013000000_init_novabudget_schema.sql
-- Description: Schéma relationnel initial NovaBudget pour Supabase / PostgreSQL
-- Tables: savings_accounts, expenses, future_projects, inflows, user_settings
-- Sécurité: Row Level Security (RLS) stricte par utilisateur (auth.uid() = user_id)
-- Triggers: Mise à jour automatique de updated_at
-- ==============================================================================

-- 1. Fonction Trigger générique pour actualiser updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 2. Tables de l'application NovaBudget
-- ==============================================================================

-- Table: savings_accounts (Comptes et livrets d'épargne)
CREATE TABLE IF NOT EXISTS savings_accounts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('securite', 'projet', 'investissement')),
  amount NUMERIC(12, 2) NOT NULL,
  rate NUMERIC(5, 2) NOT NULL DEFAULT 0,
  bank TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: expenses (Dépenses courantes ou planifiées)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  target_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: future_projects (Projets futurs d'épargne / simulation)
CREATE TABLE IF NOT EXISTS future_projects (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  target_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: inflows (Rentrées d'argent ponctuelles / primes)
CREATE TABLE IF NOT EXISTS inflows (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  target_date TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: user_settings (Paramètres globaux utilisateur)
CREATE TABLE IF NOT EXISTS user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_savings NUMERIC(12, 2) NOT NULL DEFAULT 800,
  safety_cushion NUMERIC(12, 2) NOT NULL DEFAULT 20000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 3. Triggers d'actualisation updated_at
-- ==============================================================================

DROP TRIGGER IF EXISTS trg_savings_accounts_updated_at ON savings_accounts;
CREATE TRIGGER trg_savings_accounts_updated_at
  BEFORE UPDATE ON savings_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_expenses_updated_at ON expenses;
CREATE TRIGGER trg_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_future_projects_updated_at ON future_projects;
CREATE TRIGGER trg_future_projects_updated_at
  BEFORE UPDATE ON future_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_inflows_updated_at ON inflows;
CREATE TRIGGER trg_inflows_updated_at
  BEFORE UPDATE ON inflows
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_settings_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- 4. Index de performance
-- ==============================================================================

-- Index sur savings_accounts
CREATE INDEX IF NOT EXISTS idx_savings_accounts_user_id ON savings_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_accounts_category ON savings_accounts(user_id, category);

-- Index sur expenses
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_target_date ON expenses(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_expenses_is_active ON expenses(user_id, is_active);

-- Index sur future_projects
CREATE INDEX IF NOT EXISTS idx_future_projects_user_id ON future_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_future_projects_target_date ON future_projects(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_future_projects_is_active ON future_projects(user_id, is_active);

-- Index sur inflows
CREATE INDEX IF NOT EXISTS idx_inflows_user_id ON inflows(user_id);
CREATE INDEX IF NOT EXISTS idx_inflows_target_date ON inflows(user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_inflows_is_active ON inflows(user_id, is_active);

-- ==============================================================================
-- 5. Activation Row Level Security (RLS)
-- ==============================================================================

ALTER TABLE savings_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE inflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 6. Politiques RLS (SELECT, INSERT, UPDATE, DELETE)
-- ==============================================================================

-- --- savings_accounts ---
DROP POLICY IF EXISTS "savings_accounts_select_policy" ON savings_accounts;
CREATE POLICY "savings_accounts_select_policy"
  ON savings_accounts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_accounts_insert_policy" ON savings_accounts;
CREATE POLICY "savings_accounts_insert_policy"
  ON savings_accounts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_accounts_update_policy" ON savings_accounts;
CREATE POLICY "savings_accounts_update_policy"
  ON savings_accounts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "savings_accounts_delete_policy" ON savings_accounts;
CREATE POLICY "savings_accounts_delete_policy"
  ON savings_accounts
  FOR DELETE
  USING (auth.uid() = user_id);

-- --- expenses ---
DROP POLICY IF EXISTS "expenses_select_policy" ON expenses;
CREATE POLICY "expenses_select_policy"
  ON expenses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_insert_policy" ON expenses;
CREATE POLICY "expenses_insert_policy"
  ON expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_update_policy" ON expenses;
CREATE POLICY "expenses_update_policy"
  ON expenses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses_delete_policy" ON expenses;
CREATE POLICY "expenses_delete_policy"
  ON expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- --- future_projects ---
DROP POLICY IF EXISTS "future_projects_select_policy" ON future_projects;
CREATE POLICY "future_projects_select_policy"
  ON future_projects
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "future_projects_insert_policy" ON future_projects;
CREATE POLICY "future_projects_insert_policy"
  ON future_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "future_projects_update_policy" ON future_projects;
CREATE POLICY "future_projects_update_policy"
  ON future_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "future_projects_delete_policy" ON future_projects;
CREATE POLICY "future_projects_delete_policy"
  ON future_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- --- inflows ---
DROP POLICY IF EXISTS "inflows_select_policy" ON inflows;
CREATE POLICY "inflows_select_policy"
  ON inflows
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "inflows_insert_policy" ON inflows;
CREATE POLICY "inflows_insert_policy"
  ON inflows
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inflows_update_policy" ON inflows;
CREATE POLICY "inflows_update_policy"
  ON inflows
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "inflows_delete_policy" ON inflows;
CREATE POLICY "inflows_delete_policy"
  ON inflows
  FOR DELETE
  USING (auth.uid() = user_id);

-- --- user_settings ---
DROP POLICY IF EXISTS "user_settings_select_policy" ON user_settings;
CREATE POLICY "user_settings_select_policy"
  ON user_settings
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_insert_policy" ON user_settings;
CREATE POLICY "user_settings_insert_policy"
  ON user_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_update_policy" ON user_settings;
CREATE POLICY "user_settings_update_policy"
  ON user_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_settings_delete_policy" ON user_settings;
CREATE POLICY "user_settings_delete_policy"
  ON user_settings
  FOR DELETE
  USING (auth.uid() = user_id);
