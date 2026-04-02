import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** プロフィール */
export const profiles = pgTable('profiles', {
  /** auth.users(id) への外部キー（Supabase SQL で定義） */
  id: uuid('id').primaryKey(),
  /** ユーザーが決めるID（不変・ユニーク） */
  username: varchar('username', { length: 255 }).unique().notNull(),
  /** 表示名（変更可能） */
  displayName: varchar('display_name', { length: 255 }),
  /** アバターURL（将来用） */
  avatarUrl: varchar('avatar_url', { length: 1024 }),
  /** BAN日時 */
  bannedAt: timestamp('banned_at', { withTimezone: true }),
  /** ソフトデリート日時 */
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  /** 作成日時 */
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  /** 更新日時 */
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

/** アプリ内ロール */
export const appRoleEnum = pgEnum('app_role', ['admin', 'user']);

/** ユーザーロール */
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid('user_id').notNull(),
    /** ロール */
    role: appRoleEnum('role').notNull().default('user'),
    /** 作成日時 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique('uq_user_role').on(table.userId, table.role)],
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

/**
 * チャレンジ結果 — ドリルセッションの全記録
 *
 * @description
 * チャレンジモードの完了時に1行挿入される追記専用テーブル。
 * 週間・月間ランキングは `created_at` でフィルタし `DISTINCT ON` で
 * 各ユーザーの最高スコアを抽出する。全期間ランキングは
 * `challenge_best_scores` を参照する。
 *
 * @design 2テーブル構成（Monkeytype 方式）
 *
 * - `challenge_results`: 全結果の追記ログ（INSERT のみ）。
 *   期間ランキングおよびユーザー履歴に使用。
 * - `challenge_best_scores`: ユーザー/ドリル/キーごとの
 *   全期間ベストを UPSERT で管理。
 *
 * @design menuType — ドリル種別
 *
 * 各ドリルに対応する値:
 * - 'jantou_fu' | 'machi_fu' | 'mentsu_fu' | 'tehai_fu' | 'yaku'
 * `practice/score` は自由練習のため記録対象外。
 *
 * @design leaderboardKey — ランキングセグメントキー
 *
 * ドリル内でランキングを細分化するためのキー。
 * 現時点では全ドリルで 'default' のみ。将来、難易度別や
 * 条件別のセグメントが必要になった場合に拡張可能。
 *
 * @design ランキング基準: score DESC, incorrectAnswers ASC, timeTaken ASC
 *
 * 3段階の順位決定: スコアが高い順 → ミスが少ない順 → 時間が短い順。
 */
export const challengeResults = pgTable(
  'challenge_results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid('user_id').notNull(),
    /** ドリル種別 */
    menuType: varchar('menu_type', { length: 30 }).notNull(),
    /** ランキングセグメントキー */
    leaderboardKey: varchar('leaderboard_key', { length: 20 }).notNull(),
    /** 正答数 */
    score: integer('score').notNull(),
    /** 誤答数 */
    incorrectAnswers: integer('incorrect_answers').notNull().default(0),
    /** 経過時間（秒） */
    timeTaken: integer('time_taken').notNull(),
    /** 作成日時 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_cr_period_ranking').on(
      table.menuType,
      table.leaderboardKey,
      table.createdAt,
      table.score,
      table.incorrectAnswers,
      table.timeTaken,
    ),
    index('idx_cr_user').on(table.userId, table.menuType),
  ],
);

export type ChallengeResult = typeof challengeResults.$inferSelect;
export type NewChallengeResult = typeof challengeResults.$inferInsert;

/**
 * チャレンジベストスコア — ユーザー/ドリル/キーごとの全期間ベスト
 *
 * @description
 * (userId, menuType, leaderboardKey) の組み合わせごとに1行を保持し、
 * 全期間のベストスコアを表す。チャレンジ完了時に UPSERT で更新:
 * 新結果がタプル比較 `(score, -incorrect_answers, -time_taken)` で
 * 既存より良い場合のみ更新する。
 *
 * @design challenge_results から再構築可能
 *
 * このテーブルはマテリアライズドキャッシュ。データ修正が必要な場合、
 * `challenge_results` から `DISTINCT ON` で再計算できる。
 */
export const challengeBestScores = pgTable(
  'challenge_best_scores',
  {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid('user_id').notNull(),
    /** ドリル種別 */
    menuType: varchar('menu_type', { length: 30 }).notNull(),
    /** ランキングセグメントキー */
    leaderboardKey: varchar('leaderboard_key', { length: 20 }).notNull(),
    /** 正答数 */
    score: integer('score').notNull(),
    /** 誤答数 */
    incorrectAnswers: integer('incorrect_answers').notNull().default(0),
    /** 経過時間（秒） */
    timeTaken: integer('time_taken').notNull(),
    /** ベスト達成日時 */
    achievedAt: timestamp('achieved_at', { withTimezone: true }).defaultNow().notNull(),
    /** 更新日時 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.menuType, table.leaderboardKey] }),
    index('idx_cbs_ranking').on(
      table.menuType,
      table.leaderboardKey,
      table.score,
      table.incorrectAnswers,
      table.timeTaken,
    ),
  ],
);

export type ChallengeBestScore = typeof challengeBestScores.$inferSelect;
export type NewChallengeBestScore = typeof challengeBestScores.$inferInsert;
