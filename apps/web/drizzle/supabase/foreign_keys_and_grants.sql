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

-- =============================================================================
-- moderation_actions
-- =============================================================================

-- FK constraint: moderation_actions.actor_id → auth.users(id) ON DELETE RESTRICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moderation_actions_actor_id_fkey'
  ) THEN
    ALTER TABLE public.moderation_actions
      ADD CONSTRAINT moderation_actions_actor_id_fkey
      FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
  END IF;
END;
$$;

-- FK constraint: moderation_actions.target_id → auth.users(id) ON DELETE RESTRICT
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'moderation_actions_target_id_fkey'
  ) THEN
    ALTER TABLE public.moderation_actions
      ADD CONSTRAINT moderation_actions_target_id_fkey
      FOREIGN KEY (target_id) REFERENCES auth.users(id) ON DELETE RESTRICT;
  END IF;
END;
$$;

-- =============================================================================
-- user_activity_log
-- =============================================================================

-- FK constraint: user_activity_log.user_id → auth.users(id) ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_activity_log_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_activity_log
      ADD CONSTRAINT user_activity_log_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- =============================================================================
-- exp_events
-- =============================================================================

-- FK constraint: exp_events.user_id → auth.users(id) ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exp_events_user_id_fkey'
  ) THEN
    ALTER TABLE public.exp_events
      ADD CONSTRAINT exp_events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Note: the partial unique index `uq_exp_events_source_pair ON exp_events
-- (source, source_id) WHERE source_id IS NOT NULL` is declared in schema.ts
-- and created by the generated Drizzle migration. Keeping it there (rather
-- than here) prevents schema/DB drift across regenerations.

-- exp_events writes go through the service-role client only. Grant SELECT only
-- so RLS + own-rows policy controls client reads.
GRANT SELECT ON TABLE public.exp_events TO authenticated;

-- =============================================================================
-- user_exp
-- =============================================================================

-- FK constraint: user_exp.user_id → auth.users(id) ON DELETE CASCADE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_exp_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_exp
      ADD CONSTRAINT user_exp_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- Writes are service-role only. Reads are gated by RLS policy (own rows).
GRANT SELECT ON TABLE public.user_exp TO authenticated;
