-- Transfert transactionnel : conserve les tables, identifiants, index et FK.
BEGIN;
CREATE SCHEMA IF NOT EXISTS novabudget;
GRANT USAGE ON SCHEMA novabudget TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA novabudget
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

CREATE FUNCTION novabudget.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION novabudget.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION novabudget.set_updated_at() TO authenticated, service_role;
-- La fonction historique est conservée (d'autres tables pourraient y référer), mais durcie.
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog;

ALTER TABLE public.savings_accounts SET SCHEMA novabudget;
REVOKE ALL ON novabudget.savings_accounts FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON novabudget.savings_accounts TO authenticated, service_role;
ALTER TABLE novabudget.savings_accounts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_savings_accounts_updated_at ON novabudget.savings_accounts;
CREATE TRIGGER trg_savings_accounts_updated_at BEFORE UPDATE ON novabudget.savings_accounts
  FOR EACH ROW EXECUTE FUNCTION novabudget.set_updated_at();
DROP POLICY savings_accounts_select_policy ON novabudget.savings_accounts;
CREATE POLICY savings_accounts_select_policy ON novabudget.savings_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY savings_accounts_insert_policy ON novabudget.savings_accounts;
CREATE POLICY savings_accounts_insert_policy ON novabudget.savings_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY savings_accounts_update_policy ON novabudget.savings_accounts;
CREATE POLICY savings_accounts_update_policy ON novabudget.savings_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY savings_accounts_delete_policy ON novabudget.savings_accounts;
CREATE POLICY savings_accounts_delete_policy ON novabudget.savings_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.expenses SET SCHEMA novabudget;
REVOKE ALL ON novabudget.expenses FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON novabudget.expenses TO authenticated, service_role;
ALTER TABLE novabudget.expenses ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_expenses_updated_at ON novabudget.expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON novabudget.expenses
  FOR EACH ROW EXECUTE FUNCTION novabudget.set_updated_at();
DROP POLICY expenses_select_policy ON novabudget.expenses;
CREATE POLICY expenses_select_policy ON novabudget.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY expenses_insert_policy ON novabudget.expenses;
CREATE POLICY expenses_insert_policy ON novabudget.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY expenses_update_policy ON novabudget.expenses;
CREATE POLICY expenses_update_policy ON novabudget.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY expenses_delete_policy ON novabudget.expenses;
CREATE POLICY expenses_delete_policy ON novabudget.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.future_projects SET SCHEMA novabudget;
REVOKE ALL ON novabudget.future_projects FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON novabudget.future_projects TO authenticated, service_role;
ALTER TABLE novabudget.future_projects ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_future_projects_updated_at ON novabudget.future_projects;
CREATE TRIGGER trg_future_projects_updated_at BEFORE UPDATE ON novabudget.future_projects
  FOR EACH ROW EXECUTE FUNCTION novabudget.set_updated_at();
DROP POLICY future_projects_select_policy ON novabudget.future_projects;
CREATE POLICY future_projects_select_policy ON novabudget.future_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY future_projects_insert_policy ON novabudget.future_projects;
CREATE POLICY future_projects_insert_policy ON novabudget.future_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY future_projects_update_policy ON novabudget.future_projects;
CREATE POLICY future_projects_update_policy ON novabudget.future_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY future_projects_delete_policy ON novabudget.future_projects;
CREATE POLICY future_projects_delete_policy ON novabudget.future_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.inflows SET SCHEMA novabudget;
REVOKE ALL ON novabudget.inflows FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON novabudget.inflows TO authenticated, service_role;
ALTER TABLE novabudget.inflows ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_inflows_updated_at ON novabudget.inflows;
CREATE TRIGGER trg_inflows_updated_at BEFORE UPDATE ON novabudget.inflows
  FOR EACH ROW EXECUTE FUNCTION novabudget.set_updated_at();
DROP POLICY inflows_select_policy ON novabudget.inflows;
CREATE POLICY inflows_select_policy ON novabudget.inflows FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY inflows_insert_policy ON novabudget.inflows;
CREATE POLICY inflows_insert_policy ON novabudget.inflows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY inflows_update_policy ON novabudget.inflows;
CREATE POLICY inflows_update_policy ON novabudget.inflows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY inflows_delete_policy ON novabudget.inflows;
CREATE POLICY inflows_delete_policy ON novabudget.inflows FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.user_settings SET SCHEMA novabudget;
REVOKE ALL ON novabudget.user_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON novabudget.user_settings TO authenticated, service_role;
ALTER TABLE novabudget.user_settings ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_user_settings_updated_at ON novabudget.user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON novabudget.user_settings
  FOR EACH ROW EXECUTE FUNCTION novabudget.set_updated_at();
DROP POLICY user_settings_select_policy ON novabudget.user_settings;
CREATE POLICY user_settings_select_policy ON novabudget.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY user_settings_insert_policy ON novabudget.user_settings;
CREATE POLICY user_settings_insert_policy ON novabudget.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY user_settings_update_policy ON novabudget.user_settings;
CREATE POLICY user_settings_update_policy ON novabudget.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY user_settings_delete_policy ON novabudget.user_settings;
CREATE POLICY user_settings_delete_policy ON novabudget.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT;
