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
