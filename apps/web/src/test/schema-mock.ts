/**
 * Drizzle スキーマのテスト用スタブ
 * スキーマモック
 *
 * クエリの組み立て（どのカラムを参照したか）だけを検証するテストでは、
 * 実スキーマの代わりにカラム名の対応表があれば足りる。実スキーマに
 * カラムが増えたときの追随漏れを防ぐため定義を1箇所にまとめる。
 *
 * `_name` はどのテーブルに対する操作かをアサートするための目印。
 *
 * このモジュールはテスト専用。
 */

/** learn_chapter_reads のカラム */
export const learnChapterReads = {
  _name: "learn_chapter_reads",
  userId: "user_id",
  chapterSlug: "chapter_slug",
} as const;

/** profiles のカラム */
export const profiles = {
  _name: "profiles",
  id: "id",
  username: "username",
  displayName: "display_name",
  avatarUrl: "avatar_url",
  hiddenFromLeaderboard: "hidden_from_leaderboard",
  bannedAt: "banned_at",
} as const;

/** challenge_results のカラム */
export const challengeResults = {
  _name: "challenge_results",
  id: "id",
  userId: "user_id",
  menuType: "menu_type",
  leaderboardKey: "leaderboard_key",
  score: "score",
  incorrectAnswers: "incorrect_answers",
  timeTaken: "time_taken",
  createdAt: "created_at",
} as const;

/** challenge_best_scores のカラム */
export const challengeBestScores = {
  _name: "challenge_best_scores",
  userId: "user_id",
  menuType: "menu_type",
  leaderboardKey: "leaderboard_key",
  score: "score",
  incorrectAnswers: "incorrect_answers",
  timeTaken: "time_taken",
} as const;

/** exp_events のカラム */
export const expEvents = {
  _name: "exp_events",
  id: "id",
  userId: "user_id",
  source: "source",
  sourceId: "source_id",
  amount: "amount",
  metadata: "metadata",
} as const;

/** user_exp のカラム */
export const userExp = {
  _name: "user_exp",
  userId: "user_id",
  totalExp: "total_exp",
} as const;

/** user_roles のカラム */
export const userRoles = {
  _name: "user_roles",
  userId: "user_id",
  role: "role",
} as const;

/** stripe_customers のカラム */
export const stripeCustomers = {
  _name: "stripe_customers",
  id: "id",
  userId: "user_id",
  stripeCustomerId: "stripe_customer_id",
} as const;

/** purchases のカラム */
export const purchases = {
  _name: "purchases",
  id: "id",
  userId: "user_id",
  plan: "plan",
  kind: "kind",
  benefits: "benefits",
  stripeCheckoutSessionId: "stripe_checkout_session_id",
  stripePaymentIntentId: "stripe_payment_intent_id",
  currency: "currency",
  amount: "amount",
  startsAt: "starts_at",
  expiresAt: "expires_at",
  revokedAt: "revoked_at",
  revokeReason: "revoke_reason",
  createdAt: "created_at",
} as const;

/** benefit_grants のカラム */
export const benefitGrants = {
  _name: "benefit_grants",
  id: "id",
  userId: "user_id",
  plan: "plan",
  benefits: "benefits",
  reason: "reason",
  grantedBy: "granted_by",
  startsAt: "starts_at",
  expiresAt: "expires_at",
  revokedAt: "revoked_at",
  revokeReason: "revoke_reason",
  createdAt: "created_at",
} as const;

/** 購入手続きのカラム */
export const billingCheckouts = {
  _name: "billing_checkouts",
  id: "id",
  customerId: "customer_id",
  settledAt: "settled_at",
  stripeCheckoutSessionId: "stripe_checkout_session_id",
} as const;

/** notifications のカラム */
export const notifications = {
  _name: "notifications",
  id: "id",
  userId: "user_id",
  type: "type",
  targetType: "target_type",
  targetId: "target_id",
  metadata: "metadata",
  readAt: "read_at",
  createdAt: "created_at",
} as const;
