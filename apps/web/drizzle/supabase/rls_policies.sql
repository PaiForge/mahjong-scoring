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

-- =============================================================================
-- challenge_results
-- =============================================================================
ALTER TABLE "challenge_results" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_results_select" ON "challenge_results";
CREATE POLICY "challenge_results_select" ON "challenge_results"
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_results_insert" ON "challenge_results";
CREATE POLICY "challenge_results_insert" ON "challenge_results"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- challenge_best_scores
-- =============================================================================
ALTER TABLE "challenge_best_scores" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_best_scores_select" ON "challenge_best_scores";
CREATE POLICY "challenge_best_scores_select" ON "challenge_best_scores"
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_best_scores_insert" ON "challenge_best_scores";
CREATE POLICY "challenge_best_scores_insert" ON "challenge_best_scores"
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "challenge_best_scores_update" ON "challenge_best_scores";
CREATE POLICY "challenge_best_scores_update" ON "challenge_best_scores"
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================================================
-- moderation_actions
-- =============================================================================
ALTER TABLE "moderation_actions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "moderation_actions_deny_all" ON "moderation_actions";
CREATE POLICY "moderation_actions_deny_all" ON "moderation_actions"
  USING (false);

-- =============================================================================
-- user_activity_log
-- =============================================================================
ALTER TABLE "user_activity_log" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_activity_log_deny_all" ON "user_activity_log";
CREATE POLICY "user_activity_log_deny_all" ON "user_activity_log"
  USING (false);
