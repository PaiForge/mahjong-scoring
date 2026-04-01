-- RLS Policies and Triggers
-- Applied by scripts/migrate.ts on Supabase environments.
-- All statements are convergent-idempotent (safe to run multiple times).

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON "profiles";
CREATE POLICY "profiles_select_policy" ON "profiles"
  FOR SELECT USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "profiles_insert_policy" ON "profiles";
CREATE POLICY "profiles_insert_policy" ON "profiles"
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_policy" ON "profiles";
CREATE POLICY "profiles_update_policy" ON "profiles"
  FOR UPDATE USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON "profiles";
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON "profiles"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
