-- RLS Policies and Triggers
-- Applied by scripts/migrate.ts on Supabase environments.
-- All statements are convergent-idempotent (safe to run multiple times).

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_policy" ON "profiles";
CREATE POLICY "profiles_select_policy" ON "profiles"
  FOR SELECT USING (deleted_at IS NULL);

-- INSERT / UPDATE のポリシーは置かない。書き込みはサーバ（Drizzle の直 DB 接続）
-- だけが行う（理由は foreign_keys_and_grants.sql の profiles の GRANT を参照）。
-- 下の DROP は既存環境から旧ポリシーを取り除くために残す（冪等）。
DROP POLICY IF EXISTS "profiles_insert_policy" ON "profiles";
DROP POLICY IF EXISTS "profiles_update_policy" ON "profiles";

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

-- INSERT ポリシーは意図的に持たない。書き込みは savePracticeResult
-- （サーバーの直 DB 接続、RLS バイパス）のみ。own-row の WITH CHECK は
-- 「誰の行か」しか見ず「スコアが正しいか」は見ないため、クライアントに
-- INSERT を許すと満点行をいくらでも積める。GRANT と二重に閉じる
-- （既に付与済みの DB からポリシーを取り除くため DROP は残す）。
DROP POLICY IF EXISTS "challenge_results_insert" ON "challenge_results";

-- =============================================================================
-- challenge_best_scores
-- =============================================================================
ALTER TABLE "challenge_best_scores" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "challenge_best_scores_select" ON "challenge_best_scores";
CREATE POLICY "challenge_best_scores_select" ON "challenge_best_scores"
  FOR SELECT USING (auth.uid() = user_id);

-- INSERT / UPDATE ポリシーは意図的に持たない（challenge_results と同じ理由）。
-- この表はリーダーボードの表示元であり昇級判定が読むスコアの正典なので、
-- 値を書けるのはサーバーだけにする。
DROP POLICY IF EXISTS "challenge_best_scores_insert" ON "challenge_best_scores";
DROP POLICY IF EXISTS "challenge_best_scores_update" ON "challenge_best_scores";

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

-- =============================================================================
-- exp_events
-- =============================================================================
-- Own-rows SELECT only. Writes are performed by the service-role client and
-- bypass RLS, so no INSERT/UPDATE policy is defined.
ALTER TABLE "exp_events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exp_events_select" ON "exp_events";
CREATE POLICY "exp_events_select" ON "exp_events"
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- user_exp
-- =============================================================================
-- Intentionally own-row only: `auth.uid() = user_id`.
-- An EXP leaderboard is currently OUT OF SCOPE. Do NOT relax this policy to
-- `USING (true)` without a product decision — it is not a bug. If/when a
-- leaderboard ships, add rate limiting and revisit this policy explicitly.
ALTER TABLE "user_exp" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_exp_select" ON "user_exp";
CREATE POLICY "user_exp_select" ON "user_exp"
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- lesson_completions
-- =============================================================================
-- レッスン完了は本人のみ SELECT 可。書き込みは Server Action（サーバーの直 DB
-- 接続）だけが行うので、クライアントロールには INSERT / UPDATE / DELETE の
-- どれも許可しない（完了を取り消す操作も無い。退会時の削除もサーバー）。
ALTER TABLE "lesson_completions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_completions_select" ON "lesson_completions";
CREATE POLICY "lesson_completions_select" ON "lesson_completions"
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- announcements
-- =============================================================================
-- 公開コンテンツ。誰でも published の行のみ SELECT 可。
-- 作成・更新・削除は管理画面のサーバーアクションが直 DB 接続（RLS バイパス）で
-- 行うため、INSERT/UPDATE/DELETE ポリシーは定義しない。draft は REST API 経由では
-- 参照できない。
ALTER TABLE "announcements" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "announcements_select_published" ON "announcements";
CREATE POLICY "announcements_select_published" ON "announcements"
  FOR SELECT USING (status = 'published');

DROP TRIGGER IF EXISTS announcements_updated_at ON "announcements";
CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON "announcements"
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- user_ranks
-- =============================================================================
-- 付与記録は本人のみ SELECT 可。書き込みは昇級判定（サーバー側の直 DB 接続）のみ。
ALTER TABLE "user_ranks" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_ranks_select" ON "user_ranks";
CREATE POLICY "user_ranks_select" ON "user_ranks"
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================================================
-- user_roles
-- =============================================================================
-- 管理者判定（`requireAdmin()`）の唯一の根拠となる表。クライアントからは
-- 読み書きとも一切許可しない。ロールの付与は DB へ直接 INSERT する運用
-- （README / CLAUDE.md 参照）で、アプリは直 DB 接続で読むため RLS を通らない。
--
-- `USING (false)` は WITH CHECK を省略しているため INSERT にも適用される
-- （Postgres は WITH CHECK 省略時に USING 式を新規行の検査にも使う）。
-- GRANT を剥がすだけでは不十分 — Supabase の `ALTER DEFAULT PRIVILEGES` が
-- 新規テーブルに anon / authenticated への全権限を自動付与するため、
-- 表を作り直しただけで再び開く。RLS 側にも拒否を宣言して二重に閉じる。
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_deny_all" ON "user_roles";
CREATE POLICY "user_roles_deny_all" ON "user_roles"
  USING (false);

ALTER TABLE "challenge_attempts" ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ad_creatives / ad_creative_translations
-- =============================================================================
-- ネイティブ広告。読み込み（各画面の描画）も書き込み（管理画面）もサーバーが
-- 直 DB 接続で行うため、クライアントには読み書きとも許可しない。未掲載の広告
-- （is_active = false の下書き）や遷移先をクライアントから覗かせない。
ALTER TABLE "ad_creatives" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_creatives_deny_all" ON "ad_creatives";
CREATE POLICY "ad_creatives_deny_all" ON "ad_creatives"
  USING (false);

ALTER TABLE "ad_creative_translations" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_creative_translations_deny_all" ON "ad_creative_translations";
CREATE POLICY "ad_creative_translations_deny_all" ON "ad_creative_translations"
  USING (false);

-- トラッキング ID も同じくサーバーだけが読む
ALTER TABLE "ad_network_settings" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ad_network_settings_deny_all" ON "ad_network_settings";
CREATE POLICY "ad_network_settings_deny_all" ON "ad_network_settings"
  USING (false);

-- =============================================================================
-- stripe_customers / purchases / stripe_webhook_events
-- =============================================================================
-- 有料プラン。Stripe の顧客対応・購入記録・Webhook の重複排除は、読み込み
-- （特典の判定・マイページの購入履歴）も書き込み（Checkout 完了・Webhook）も
-- サーバーが直 DB 接続で行う。クライアントに Stripe の ID を読ませる理由がなく、
-- 購入行を書き換えられれば特典を自分で付けられるため、読み書きとも許可しない。
ALTER TABLE "stripe_customers" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_customers_deny_all" ON "stripe_customers";
CREATE POLICY "stripe_customers_deny_all" ON "stripe_customers"
  USING (false);

ALTER TABLE "purchases" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchases_deny_all" ON "purchases";
CREATE POLICY "purchases_deny_all" ON "purchases"
  USING (false);

ALTER TABLE "stripe_webhook_events" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "stripe_webhook_events_deny_all" ON "stripe_webhook_events";
CREATE POLICY "stripe_webhook_events_deny_all" ON "stripe_webhook_events"
  USING (false);

-- =============================================================================
-- practice_quota_usage
-- =============================================================================
-- 練習の無料枠の消費記録。増やすのは Server Action（直 DB 接続）だけで、
-- クライアントが読み書きできると自分の消費を消せるため、読み書きとも許可しない。
ALTER TABLE "practice_quota_usage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "practice_quota_usage_deny_all" ON "practice_quota_usage";
CREATE POLICY "practice_quota_usage_deny_all" ON "practice_quota_usage"
  USING (false);

-- =============================================================================
-- benefit_grants
-- =============================================================================
-- 特典の手動付与。読み込み（特典の判定・マイページ）も書き込み（管理画面）も
-- サーバーが直 DB 接続で行う。付与行を書ければ特典を自分で付けられるため、
-- 読み書きとも許可しない。
ALTER TABLE "benefit_grants" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "benefit_grants_deny_all" ON "benefit_grants";
CREATE POLICY "benefit_grants_deny_all" ON "benefit_grants"
  USING (false);

-- Checkout の予約と販売条件はサーバー専用。クライアントは読み書きできない。
ALTER TABLE "billing_checkouts" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "billing_checkouts_deny_all" ON "billing_checkouts";
CREATE POLICY "billing_checkouts_deny_all" ON "billing_checkouts" USING (false);

-- =============================================================================
-- notifications
-- =============================================================================
-- サイト内通知。一覧・未読数・既読化はサーバー（Server Action / Route Handler）が
-- 直 DB 接続で本人の行だけを扱う。クライアントに直接読ませる経路が無く、
-- 書き込みを許すと他人宛ての通知を作れるため、読み書きとも許可しない。
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_deny_all" ON "notifications";
CREATE POLICY "notifications_deny_all" ON "notifications"
  USING (false);

-- =============================================================================
-- account_deletions
-- =============================================================================
-- 退会の要求と進み具合。受付・処理・状態の確認はすべてサーバーが直 DB 接続で
-- 行う。書ければ他人を退会処理中にできるため、読み書きとも許可しない。
ALTER TABLE "account_deletions" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "account_deletions_deny_all" ON "account_deletions";
CREATE POLICY "account_deletions_deny_all" ON "account_deletions"
  USING (false);
