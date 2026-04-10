import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
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

/**
 * モデレーションアクション — 管理者の操作記録
 *
 * @description
 * BAN / BAN解除などの管理者操作を記録する監査ログテーブル。
 * 管理者（actorId）が対象ユーザー（targetId）に対して行った
 * アクションとその理由を保持する。
 */
export const moderationActions = pgTable(
  'moderation_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 操作を実行した管理者の auth.users(id) */
    actorId: uuid('actor_id').notNull(),
    /** 実行されたアクション（例: ban, unban） */
    action: varchar('action', { length: 50 }).notNull(),
    /** 対象のエンティティ種別（例: user） */
    targetType: varchar('target_type', { length: 50 }).notNull(),
    /** 対象エンティティの ID */
    targetId: uuid('target_id').notNull(),
    /** 操作の理由（任意） */
    reason: text('reason'),
    /** 追加メタデータ */
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    /** 操作元の IP アドレス */
    ipAddress: varchar('ip_address', { length: 45 }),
    /** 作成日時 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_ma_actor').on(table.actorId),
    index('idx_ma_target').on(table.targetType, table.targetId),
    index('idx_ma_action').on(table.action),
    index('idx_ma_created_at').on(table.createdAt),
  ],
);

export type ModerationAction = typeof moderationActions.$inferSelect;
export type NewModerationAction = typeof moderationActions.$inferInsert;

/**
 * ユーザーアクティビティログ — ユーザー行動の記録
 *
 * @description
 * ログイン・ログアウト・パスワード変更などのユーザー行動を
 * fire-and-forget で記録するテーブル。
 */
export const userActivityLog = pgTable(
  'user_activity_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** 行動したユーザーの auth.users(id) */
    userId: uuid('user_id').notNull(),
    /** 行動の種類（例: login, logout, change_password） */
    action: varchar('action', { length: 50 }).notNull(),
    /** 対象のエンティティ種別（任意） */
    targetType: varchar('target_type', { length: 50 }),
    /** 対象エンティティの ID（任意） */
    targetId: uuid('target_id'),
    /** 追加メタデータ */
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    /** 作成日時 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_ual_user').on(table.userId),
    index('idx_ual_action').on(table.action),
    index('idx_ual_target').on(table.targetType, table.targetId),
    index('idx_ual_created_at').on(table.createdAt),
  ],
);

export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type NewUserActivityLog = typeof userActivityLog.$inferInsert;

/**
 * EXP イベント — 経験値付与の追記専用ログ
 *
 * @description
 * ユーザーに経験値が付与されるたびに 1 行 INSERT される追記専用テーブル。
 * 冪等性は `(source, source_id)` の partial unique index で担保する
 * （`source_id IS NOT NULL` のみ）。これにより同じチャレンジ結果に対する
 * 重複付与（再送・リロード等）を防ぐ。
 *
 * @design source / source_id — 付与根拠の追跡
 *
 * - `source`: 付与イベントの種類（例: `'challenge_result'`）
 * - `source_id`: 対応する `challenge_results.id` 等の UUID
 * - `menu_type`: ドリル種別（`challenge_result` の場合）
 * - `metadata`: 計算内訳（score, incorrectAnswers, baseExp, 倍率 等）
 */
export const expEvents = pgTable(
  'exp_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid('user_id').notNull(),
    /** 付与イベントの種類（例: 'challenge_result'） */
    source: varchar('source', { length: 50 }).notNull(),
    /** 付与根拠となる行の ID（冪等キーとしても機能する） */
    sourceId: uuid('source_id'),
    /** ドリル種別 */
    menuType: varchar('menu_type', { length: 30 }),
    /** 付与された EXP */
    amount: integer('amount').notNull(),
    /** 計算内訳などの補助メタデータ */
    metadata: jsonb('metadata').default({}).$type<Record<string, unknown>>(),
    /** 作成日時 */
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_exp_events_user_created').on(table.userId, table.createdAt),
    index('idx_exp_events_source').on(table.source, table.sourceId),
    // 冪等キー: 同じ (source, source_id) ペアでの二重付与を防ぐ partial unique index。
    // source_id は将来の用途（デイリーログインボーナス等）で NULL になりうるため
    // 部分インデックスで「source_id IS NOT NULL」に限定する。
    // この partial predicate は `grantChallengeExp` の `onConflictDoNothing` の
    // `where` 句と必ず一致させる必要がある（Postgres の ON CONFLICT 推論の制約）。
    uniqueIndex('uq_exp_events_source_pair')
      .on(table.source, table.sourceId)
      .where(sql`source_id IS NOT NULL`),
  ],
);

export type ExpEvent = typeof expEvents.$inferSelect;
export type NewExpEvent = typeof expEvents.$inferInsert;

/**
 * ユーザー累計 EXP — マテリアライズドキャッシュ
 *
 * @description
 * `(user_id)` ごとの累計 EXP を保持するキャッシュテーブル。
 * `exp_events` からの `SUM(amount)` で再構築可能。
 * 付与時は INSERT ... ON CONFLICT DO UPDATE で累積加算する。
 */
export const userExp = pgTable(
  'user_exp',
  {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid('user_id').primaryKey(),
    /** 累計 EXP */
    totalExp: integer('total_exp').notNull().default(0),
    /** 更新日時 */
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('idx_user_exp_total').on(table.totalExp)],
);

export type UserExp = typeof userExp.$inferSelect;
export type NewUserExp = typeof userExp.$inferInsert;
