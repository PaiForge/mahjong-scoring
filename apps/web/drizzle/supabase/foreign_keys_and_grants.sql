-- Foreign Keys and Grants
-- Applied by scripts/migrate.ts on Supabase environments.

-- profiles.id → auth.users(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_id_fkey'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE RESTRICT;
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- =============================================================================
-- challenge_results
-- =============================================================================

-- FK constraint: challenge_results.user_id → auth.users(id) ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'challenge_results_user_id_fkey'
  ) THEN
    ALTER TABLE public.challenge_results
      ADD CONSTRAINT challenge_results_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

GRANT SELECT, INSERT ON TABLE public.challenge_results TO authenticated;

-- =============================================================================
-- challenge_best_scores
-- =============================================================================

-- FK constraint: challenge_best_scores.user_id → auth.users(id) ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'challenge_best_scores_user_id_fkey'
  ) THEN
    ALTER TABLE public.challenge_best_scores
      ADD CONSTRAINT challenge_best_scores_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

GRANT SELECT, INSERT, UPDATE ON TABLE public.challenge_best_scores TO authenticated;
