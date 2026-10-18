-- Transfert transactionnel : déplace les 5 tables de novabudget vers nova en conservant identifiants, index et FK.
BEGIN;
CREATE SCHEMA IF NOT EXISTS nova;
GRANT USAGE ON SCHEMA nova TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA nova
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, service_role;

CREATE FUNCTION nova.set_updated_at() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION nova.set_updated_at() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION nova.set_updated_at() TO authenticated, service_role;

ALTER TABLE novabudget.savings_accounts SET SCHEMA nova;
REVOKE ALL ON nova.savings_accounts FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nova.savings_accounts TO authenticated, service_role;
ALTER TABLE nova.savings_accounts ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_savings_accounts_updated_at ON nova.savings_accounts;
CREATE TRIGGER trg_savings_accounts_updated_at BEFORE UPDATE ON nova.savings_accounts
  FOR EACH ROW EXECUTE FUNCTION nova.set_updated_at();
DROP POLICY savings_accounts_select_policy ON nova.savings_accounts;
CREATE POLICY savings_accounts_select_policy ON nova.savings_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY savings_accounts_insert_policy ON nova.savings_accounts;
CREATE POLICY savings_accounts_insert_policy ON nova.savings_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY savings_accounts_update_policy ON nova.savings_accounts;
CREATE POLICY savings_accounts_update_policy ON nova.savings_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY savings_accounts_delete_policy ON nova.savings_accounts;
CREATE POLICY savings_accounts_delete_policy ON nova.savings_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE novabudget.expenses SET SCHEMA nova;
REVOKE ALL ON nova.expenses FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nova.expenses TO authenticated, service_role;
ALTER TABLE nova.expenses ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_expenses_updated_at ON nova.expenses;
CREATE TRIGGER trg_expenses_updated_at BEFORE UPDATE ON nova.expenses
  FOR EACH ROW EXECUTE FUNCTION nova.set_updated_at();
DROP POLICY expenses_select_policy ON nova.expenses;
CREATE POLICY expenses_select_policy ON nova.expenses FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY expenses_insert_policy ON nova.expenses;
CREATE POLICY expenses_insert_policy ON nova.expenses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY expenses_update_policy ON nova.expenses;
CREATE POLICY expenses_update_policy ON nova.expenses FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY expenses_delete_policy ON nova.expenses;
CREATE POLICY expenses_delete_policy ON nova.expenses FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE novabudget.future_projects SET SCHEMA nova;
REVOKE ALL ON nova.future_projects FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nova.future_projects TO authenticated, service_role;
ALTER TABLE nova.future_projects ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_future_projects_updated_at ON nova.future_projects;
CREATE TRIGGER trg_future_projects_updated_at BEFORE UPDATE ON nova.future_projects
  FOR EACH ROW EXECUTE FUNCTION nova.set_updated_at();
DROP POLICY future_projects_select_policy ON nova.future_projects;
CREATE POLICY future_projects_select_policy ON nova.future_projects FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY future_projects_insert_policy ON nova.future_projects;
CREATE POLICY future_projects_insert_policy ON nova.future_projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY future_projects_update_policy ON nova.future_projects;
CREATE POLICY future_projects_update_policy ON nova.future_projects FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY future_projects_delete_policy ON nova.future_projects;
CREATE POLICY future_projects_delete_policy ON nova.future_projects FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE novabudget.inflows SET SCHEMA nova;
REVOKE ALL ON nova.inflows FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nova.inflows TO authenticated, service_role;
ALTER TABLE nova.inflows ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_inflows_updated_at ON nova.inflows;
CREATE TRIGGER trg_inflows_updated_at BEFORE UPDATE ON nova.inflows
  FOR EACH ROW EXECUTE FUNCTION nova.set_updated_at();
DROP POLICY inflows_select_policy ON nova.inflows;
CREATE POLICY inflows_select_policy ON nova.inflows FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY inflows_insert_policy ON nova.inflows;
CREATE POLICY inflows_insert_policy ON nova.inflows FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY inflows_update_policy ON nova.inflows;
CREATE POLICY inflows_update_policy ON nova.inflows FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY inflows_delete_policy ON nova.inflows;
CREATE POLICY inflows_delete_policy ON nova.inflows FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE novabudget.user_settings SET SCHEMA nova;
REVOKE ALL ON nova.user_settings FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON nova.user_settings TO authenticated, service_role;
ALTER TABLE nova.user_settings ENABLE ROW LEVEL SECURITY;
DROP TRIGGER trg_user_settings_updated_at ON nova.user_settings;
CREATE TRIGGER trg_user_settings_updated_at BEFORE UPDATE ON nova.user_settings
  FOR EACH ROW EXECUTE FUNCTION nova.set_updated_at();
DROP POLICY user_settings_select_policy ON nova.user_settings;
CREATE POLICY user_settings_select_policy ON nova.user_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY user_settings_insert_policy ON nova.user_settings;
CREATE POLICY user_settings_insert_policy ON nova.user_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY user_settings_update_policy ON nova.user_settings;
CREATE POLICY user_settings_update_policy ON nova.user_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY user_settings_delete_policy ON nova.user_settings;
CREATE POLICY user_settings_delete_policy ON nova.user_settings FOR DELETE TO authenticated USING (auth.uid() = user_id);

COMMIT;
