import type { ChallengeState } from "../challenge/types";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
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
} from "drizzle-orm/pg-core";

/** プロフィール */
export const profiles = pgTable("profiles", {
  /** auth.users(id) への外部キー（Supabase SQL で定義） */
  id: uuid("id").primaryKey(),
  /** ユーザーが決めるID（不変・ユニーク） */
  username: varchar("username", { length: 255 }).unique().notNull(),
  /** 表示名（変更可能） */
  displayName: varchar("display_name", { length: 255 }),
  /** アバターURL（avatars バケットの公開URL。ランキング等で表示） */
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  /** 自己紹介 */
  bio: text("bio"),
  /** X(旧Twitter) ユーザー名（先頭 @ は除いて保存） */
  xUsername: varchar("x_username", { length: 15 }),
  /** Instagram ユーザー名（先頭 @ は除いて保存） */
  instagramUsername: varchar("instagram_username", { length: 30 }),
  /** YouTube ハンドル（先頭 @ は除いて保存） */
  youtubeHandle: varchar("youtube_handle", { length: 30 }),
  /**
   * ランキング非表示（本人によるオプトアウト）
   *
   * @description
   * 設定ページ（`/preferences`）でユーザー自身が切り替える。true の間、
   * ランキングの母集団から外れ、一覧にも自分の順位行にも出なくなる。
   *
   * @design 「これから出ない」スイッチであって記録の削除ではない
   * 成績（`challenge_results` / `challenge_best_scores`）はそのまま残り、
   * オフに戻せば順位も戻る。設定画面の説明文もそう書いてある。
   *
   * @design 絞り込みは母集団を組み立てる層で行う
   * 順位は「並べた結果の何行目か」で決まるため、表示クエリだけで隠すと
   * 順位番号に欠番が出る。`leaderboard-visibility.ts` の述語を
   * ランキングの母集団（一覧・件数・ROW_NUMBER の入力）すべてに通す。
   *
   * インデックスは張らない。選択性の低い boolean で、常に索引済みの
   * menu_type / leaderboard_key の絞り込みと同時に評価されるため。
   */
  hiddenFromLeaderboard: boolean("hidden_from_leaderboard")
    .notNull()
    .default(false),
  /** BAN日時 */
  bannedAt: timestamp("banned_at", { withTimezone: true }),
  /** ソフトデリート日時 */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  /** 作成日時 */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  /** 更新日時 */
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

/** アプリ内ロール */
export const appRoleEnum = pgEnum("app_role", ["admin", "user"]);

/** ユーザーロール */
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** ロール */
    role: appRoleEnum("role").notNull().default("user"),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [unique("uq_user_role").on(table.userId, table.role)],
);

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

/**
 * チャレンジの成績を表す共通カラム
 * 成績カラム
 *
 * `challenge_best_scores` は `challenge_results` から再構築できる関係にあり、
 * 両テーブルは同じ成績タプルを持つ。片方だけ長さや既定値を変えると静かに
 * 壊れるため定義を1箇所にする。呼び出しごとに新しいビルダーを返す。
 */
function scoreTupleColumns() {
  return {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** 練習種別 */
    menuType: varchar("menu_type", { length: 30 }).notNull(),
    /** ランキングセグメントキー */
    leaderboardKey: varchar("leaderboard_key", { length: 20 }).notNull(),
    /** 正答数 */
    score: integer("score").notNull(),
    /** 誤答数 */
    incorrectAnswers: integer("incorrect_answers").notNull().default(0),
    /** 経過時間（秒） */
    timeTaken: integer("time_taken").notNull(),
  };
}

/**
 * チャレンジ結果 — チャレンジ1回ごとの全記録
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
 * - `challenge_best_scores`: ユーザー/練習/キーごとの
 *   全期間ベストを UPSERT で管理。
 *
 * @design menuType — 練習種別
 *
 * 各練習に対応する値:
 * - 'jantou_fu' | 'machi_fu' | 'mentsu_fu' | 'mentsu_jantou_fu' | 'total_fu' | 'yaku'
 * `practice/score` は自由練習のため記録対象外。
 *
 * @design leaderboardKey — ランキングセグメントキー
 *
 * 練習内でランキングを細分化するためのキー。
 * 現時点では全練習で 'default' のみ。将来、難易度別や
 * 条件別のセグメントが必要になった場合に拡張可能。
 *
 * @design ランキング基準: score DESC, incorrectAnswers ASC, timeTaken ASC
 *
 * 3段階の順位決定: スコアが高い順 → ミスが少ない順 → 時間が短い順。
 */
export const challengeResults = pgTable(
  "challenge_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ...scoreTupleColumns(),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_cr_period_ranking").on(
      table.menuType,
      table.leaderboardKey,
      table.createdAt,
      table.score,
      table.incorrectAnswers,
      table.timeTaken,
    ),
    index("idx_cr_user").on(table.userId, table.menuType),
  ],
);

export type ChallengeResult = typeof challengeResults.$inferSelect;
export type NewChallengeResult = typeof challengeResults.$inferInsert;

/**
 * チャレンジベストスコア — ユーザー/練習/キーごとの全期間ベスト
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
  "challenge_best_scores",
  {
    ...scoreTupleColumns(),
    /** ベスト達成日時 */
    achievedAt: timestamp("achieved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** 更新日時 */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.menuType, table.leaderboardKey],
    }),
    index("idx_cbs_ranking").on(
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
  "moderation_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 操作を実行した管理者の auth.users(id) */
    actorId: uuid("actor_id").notNull(),
    /** 実行されたアクション（例: ban, unban） */
    action: varchar("action", { length: 50 }).notNull(),
    /** 対象のエンティティ種別（例: user） */
    targetType: varchar("target_type", { length: 50 }).notNull(),
    /** 対象エンティティの ID */
    targetId: uuid("target_id").notNull(),
    /** 操作の理由（任意） */
    reason: text("reason"),
    /** 追加メタデータ */
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
    /** 操作元の IP アドレス */
    ipAddress: varchar("ip_address", { length: 45 }),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_ma_actor").on(table.actorId),
    index("idx_ma_target").on(table.targetType, table.targetId),
    index("idx_ma_action").on(table.action),
    index("idx_ma_created_at").on(table.createdAt),
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
  "user_activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 行動したユーザーの auth.users(id) */
    userId: uuid("user_id").notNull(),
    /** 行動の種類（例: login, logout, change_password） */
    action: varchar("action", { length: 50 }).notNull(),
    /** 対象のエンティティ種別（任意） */
    targetType: varchar("target_type", { length: 50 }),
    /** 対象エンティティの ID（任意） */
    targetId: uuid("target_id"),
    /** 追加メタデータ */
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_ual_user").on(table.userId),
    index("idx_ual_action").on(table.action),
    index("idx_ual_target").on(table.targetType, table.targetId),
    index("idx_ual_created_at").on(table.createdAt),
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
 * - `menu_type`: 練習種別（`challenge_result` の場合）
 * - `metadata`: 計算内訳（score, incorrectAnswers, baseExp, 倍率 等）
 */
export const expEvents = pgTable(
  "exp_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** 付与イベントの種類（例: 'challenge_result'） */
    source: varchar("source", { length: 50 }).notNull(),
    /** 付与根拠となる行の ID（冪等キーとしても機能する） */
    sourceId: uuid("source_id"),
    /** 練習種別 */
    menuType: varchar("menu_type", { length: 30 }),
    /** 付与された EXP */
    amount: integer("amount").notNull(),
    /** 計算内訳などの補助メタデータ */
    metadata: jsonb("metadata").default({}).$type<Record<string, unknown>>(),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_exp_events_user_created").on(table.userId, table.createdAt),
    index("idx_exp_events_source").on(table.source, table.sourceId),
    // 冪等キー: 同じ (source, source_id) ペアでの二重付与を防ぐ partial unique index。
    // source_id は将来の用途（デイリーログインボーナス等）で NULL になりうるため
    // 部分インデックスで「source_id IS NOT NULL」に限定する。
    // この partial predicate は `grantChallengeExp` の `onConflictDoNothing` の
    // `where` 句と必ず一致させる必要がある（Postgres の ON CONFLICT 推論の制約）。
    uniqueIndex("uq_exp_events_source_pair")
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
  "user_exp",
  {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").primaryKey(),
    /** 累計 EXP */
    totalExp: integer("total_exp").notNull().default(0),
    /** 更新日時 */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("idx_user_exp_total").on(table.totalExp)],
);

export type UserExp = typeof userExp.$inferSelect;
export type NewUserExp = typeof userExp.$inferInsert;

/**
 * 章読了 — ユーザーごとの学習章の読了記録
 * 学習進捗
 *
 * @description
 * 認証ユーザーが `/learn/<slug>` を「読了」とマークするたびに 1 行 INSERT される。
 * (user_id, chapter_slug) で 1 ユニーク。
 *
 * @design chapter_slug を文字列キーとして保持し DB 側で enum 化しない
 * 章の追加・削除はコード側（_lib/curriculum.ts）で完結させ、
 * DB マイグレーションを不要にする。
 *
 * @design 将来 source カラム（"manual" | "auto"）を追加する場合は
 * ADD COLUMN source varchar(16) NOT NULL DEFAULT 'manual' で既存行ごと
 * 安全に拡張可能。現時点では YAGNI で見送り。
 */
export const learnChapterReads = pgTable(
  "learn_chapter_reads",
  {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** 章スラッグ（curriculum.ts で管理） */
    chapterSlug: varchar("chapter_slug", { length: 64 }).notNull(),
    /** 読了日時 */
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.chapterSlug] }),
    index("idx_lcr_user").on(table.userId),
    // chapter_slug の形式を制約: 先頭は英小文字、以降は英小文字・数字・ハイフン
    // (最長 64 文字)。アプリ側 curriculum.ts の slug 命名規則に合わせ、
    // 任意文字列の INSERT を DB 層でも防ぐ二重防御。
    check(
      "learn_chapter_reads_chapter_slug_format",
      sql`${table.chapterSlug} ~ '^[a-z][a-z0-9-]{0,63}$'`,
    ),
  ],
);

export type LearnChapterRead = typeof learnChapterReads.$inferSelect;
export type NewLearnChapterRead = typeof learnChapterReads.$inferInsert;

/**
 * お知らせ — 運営からのアナウンス
 *
 * @description
 * 管理画面で作成・公開する運営アナウンス。公開ページ（/announcements）と
 * 詳細ページ（/announcements/[slug]）で表示する。本文は Markdown。
 *
 * @design slug + locale の多言語構成
 * 同一 slug に対しロケールごとの variant を許容し `uq(slug, locale)` で一意化する。
 * 現状 UI のロケールは ja 固定だが、将来の英語対応を見越してスキーマ側で
 * 多言語を表現できるようにしている。一覧/詳細クエリは要求ロケール →
 * DEFAULT_LOCALE → 任意の順で variant を選ぶ（_lib/queries.ts）。
 *
 * @design status — draft / published
 * 公開ページに出るのは status='published' の行のみ。published には
 * published_at が必須（バリデーションで担保）。pinned_at が新しい行を
 * 一覧の先頭に固定表示する。
 */
export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** URL スラッグ（ロケール間で共有） */
    slug: varchar("slug", { length: 255 }).notNull(),
    /** タイトル */
    title: varchar("title", { length: 255 }).notNull(),
    /** 本文（Markdown） */
    content: text("content").notNull(),
    /** ロケール（BCP 47） */
    locale: varchar("locale", { length: 10 }).notNull(),
    /** 公開状態（draft / published） */
    status: varchar("status", { length: 20 }).notNull().default("draft"),
    /** ピン留め日時（新しいものを一覧先頭に固定） */
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    /** 公開日時（published 時は必須） */
    publishedAt: timestamp("published_at", { withTimezone: true }),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** 更新日時 */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("uq_announcements_slug_locale").on(table.slug, table.locale),
    index("idx_announcements_status_published").on(
      table.status,
      table.publishedAt,
    ),
  ],
);

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

/**
 * 段級位の付与記録 — ユーザーが達成した段級位
 *
 * @description
 * 昇級判定（`lib/db/rank-evaluation.ts`）が要件達成を検出したときに
 * 1行挿入される追記専用テーブル。ランクの定義そのもの（要件・序列）は
 * DB に持たず、コードの `lib/ranks/registry.ts` が正典。
 *
 * @design 主キー (user_id, rank_slug)
 *
 * 付与は `onConflictDoNothing` で冪等にする（判定は結果保存のたびに
 * 走るため、同じランクを二重に付与しない）。剥奪は想定しない。
 */
export const userRanks = pgTable(
  "user_ranks",
  {
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** 段級位スラッグ（`lib/ranks/registry.ts` の slug） */
    rankSlug: varchar("rank_slug", { length: 30 }).notNull(),
    /** 付与日時 */
    grantedAt: timestamp("granted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.rankSlug] })],
);

export type UserRank = typeof userRanks.$inferSelect;
export type NewUserRank = typeof userRanks.$inferInsert;

/** サーバー採点用の挑戦。正解と時計を含むためクライアントからは読み書き禁止。 */
export const challengeAttempts = pgTable("challenge_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  state: jsonb("state").$type<ChallengeState>().notNull(),
  consumed: boolean("consumed").notNull().default(false),
});

/**
 * ネイティブ広告の広告本体
 * 広告クリエイティブ
 *
 * @description
 * 自前で配信するネイティブ広告（Amazon アソシエイトのリンク等）。
 * スロット（掲載枠）と広告の形の対応は `lib/ads/registry.ts` が正典。
 * 文言（タイトル・説明）はロケールごとに {@link adCreativeTranslations} に持つ。
 *
 * @design slot は一意ではない
 * 1 スロットに有効な広告が複数あれば `sort_order` 順に回す。スロットの一覧は
 * コード側で増えるため CHECK を付けない（書き込みは registry で検証する）。
 * `kind` はスロットから導出して書き込む値で、管理者は選ばない。それでも
 * 保存するのは、下の CHECK が kind ごとの必須項目を検査するため
 * （CHECK からは registry を読めない）。
 *
 * @design 削除せず無効化する
 * 行の id は管理画面と各画面の描画をつなぐ唯一の識別子で、掲載の履歴を
 * 追うときにも使う。消すと過去の成果と突き合わせられなくなるため、削除の
 * 操作は持たず `is_active` を落とす。
 *
 * @design リンクは URL か ASIN のどちらか 1 つ
 * Amazon の商品は ASIN だけを持ち、リンクは表示のたびに ASIN と
 * トラッキング ID（{@link adNetworkSettings}）から組み立てる
 * （`lib/ads/amazon.ts`）。トラッキング ID は運用者個人の設定で、公開
 * リポジトリのシードや行に焼き込まないため。Amazon 以外の広告は `href` に
 * URL をそのまま持つ。
 *
 * @design 画像と代替テキストは対
 * `image_alt` は `image_path` と一緒にしか入らない。広告は絵文字（`icon`）・
 * 画像・手牌（`hand`）のどれかを必ず持つ — どれも無いカードは周りの練習
 * カード・行リンクと見た目が揃わず、広告だけが浮く。手牌はカード型だけが
 * 描く（行に帯を置く場所は無い）が、その区別は kind ごとの必須項目として
 * 管理画面の検証が持つ。
 */
export const adCreatives = pgTable(
  "ad_creatives",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** 広告の形（`lib/ads/registry.ts` の `AdKind`） */
    kind: varchar("kind", { length: 50 }).notNull(),
    /** 掲載枠（`lib/ads/registry.ts` の `AdSlot`）。一意ではない */
    slot: varchar("slot", { length: 50 }).notNull(),
    /** 遷移先の URL。ASIN で指す広告は持たない */
    href: varchar("href", { length: 2048 }),
    /**
     * Amazon の商品の ASIN（書籍の ISBN-10 / Kindle 本の B0… 等）。リンクは
     * 表示時にトラッキング ID と組み立てる
     */
    asin: varchar("asin", { length: 10 }),
    /** 掲載中か。唯一のオン / オフ */
    isActive: boolean("is_active").notNull().default(false),
    /** スロット内の並び順（小さいほど先） */
    sortOrder: integer("sort_order").notNull().default(0),
    /** 絵文字。画像が無いときの見た目 */
    icon: varchar("icon", { length: 16 }),
    /** 画像の公開 URL（Storage の ad-creatives バケット） */
    imagePath: varchar("image_path", { length: 1024 }),
    /** 画像の代替テキスト */
    imageAlt: varchar("image_alt", { length: 255 }),
    /**
     * カードの帯に並べる手牌（MSPZ 表記）。練習カードの帯と同じ緑の面に
     * 牌を出す。表記で持つのは管理画面で読み書きできるようにするため
     */
    hand: varchar("hand", { length: 64 }),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    /** 更新日時 */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_ad_creatives_slot_active").on(table.slot, table.isActive),
    check(
      "ad_creatives_chk_kind",
      sql`${table.kind} IN ('native_card', 'native_row')`,
    ),
    check(
      "ad_creatives_chk_has_visual",
      sql`(${table.icon} IS NOT NULL AND ${table.icon} <> '') OR ${table.imagePath} IS NOT NULL OR ${table.hand} IS NOT NULL`,
    ),
    check(
      "ad_creatives_chk_image_alt_with_image",
      sql`${table.imageAlt} IS NULL OR ${table.imagePath} IS NOT NULL`,
    ),
    check(
      "ad_creatives_chk_one_link",
      sql`(${table.href} IS NULL) <> (${table.asin} IS NULL)`,
    ),
    check("ad_creatives_chk_asin", sql`${table.asin} ~ '^[A-Z0-9]{10}$'`),
  ],
);

export type AdCreative = typeof adCreatives.$inferSelect;
export type NewAdCreative = typeof adCreatives.$inferInsert;

/**
 * 広告ネットワークごとの設定（アフィリエイトのトラッキング ID）
 * 広告ネットワーク設定
 *
 * ASIN で指す広告（{@link adCreatives}）のリンクは、ここのトラッキング ID と
 * 組み立てる。行が無い（未設定）間は、ASIN の広告を画面に出さない —
 * トラッキング ID の無いリンクは成果に結び付かない。
 *
 * 運用者個人の設定なので、シードもコードも書かない。管理画面
 * （`/admin/ads`）でだけ設定する。
 */
export const adNetworkSettings = pgTable(
  "ad_network_settings",
  {
    /** ネットワーク（`lib/ads/amazon.ts` の `AMAZON_NETWORK`） */
    network: varchar("network", { length: 50 }).primaryKey(),
    /** トラッキング ID（Amazon アソシエイトの `tag=` の値） */
    trackingId: varchar("tracking_id", { length: 64 }).notNull(),
    /** 更新日時 */
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "ad_network_settings_chk_network",
      sql`${table.network} IN ('amazon_jp')`,
    ),
  ],
);

/**
 * ネイティブ広告の文言（ロケールごと）
 * 広告文言
 *
 * @design 子テーブルにする
 * お知らせのように 1 ロケール 1 行にしないのは、1 つの広告のロケール違いは
 * 同じ広告だから。遷移先・掲載状態・並び順・id を共有し、行を分けると
 * 1 つの広告が 2 つに見える。
 *
 * 既定ロケール（ja）の行はタイトルを必ず持つ（他ロケールの穴埋め先のため）。
 * 他ロケールの行はどちらか片方だけを上書きしてよく、空いた項目は ja に落ちる
 * （`lib/ads/copy.ts`）。何も上書きしない行は作らない。
 */
export const adCreativeTranslations = pgTable(
  "ad_creative_translations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    creativeId: uuid("creative_id")
      .notNull()
      .references(() => adCreatives.id, { onDelete: "cascade" }),
    /** ロケール（BCP 47） */
    locale: varchar("locale", { length: 10 }).notNull(),
    /** タイトル */
    title: varchar("title", { length: 255 }),
    /** 説明 */
    description: varchar("description", { length: 1000 }),
  },
  (table) => [
    unique("uq_ad_creative_translations_locale").on(
      table.creativeId,
      table.locale,
    ),
    check(
      "ad_creative_translations_chk_says_something",
      sql`${table.title} IS NOT NULL OR ${table.description} IS NOT NULL`,
    ),
    check(
      "ad_creative_translations_chk_default_locale_title",
      sql`${table.locale} <> 'ja' OR ${table.title} IS NOT NULL`,
    ),
  ],
);

export type AdCreativeTranslation = typeof adCreativeTranslations.$inferSelect;

/**
 * Stripe の顧客とユーザーの対応（1 ユーザー = 1 顧客）
 * Stripe顧客
 *
 * @description
 * Checkout を作るときに `customer` として渡す ID の置き場。初回の購入で
 * Stripe に顧客を作ってここに保存し、以後の購入は同じ顧客に束ねる
 * （領収書メール・購入履歴が Stripe 側でも 1 人にまとまる）。
 *
 * 購入の所有者を決める根拠はこの表だけ。Checkout 完了の着地と Webhook は
 * `session.customer` をこの表で引いてユーザーに変換する。Stripe の
 * metadata にも userId を入れているが、所有者の判定には使わない —
 * 根拠を 2 本持つと食い違ったときにどちらを信じるかという問題が生まれる。
 *
 * @design `user_id` → auth.users の FK は Supabase SQL で定義（CASCADE）
 */
export const stripeCustomers = pgTable("stripe_customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  /** auth.users(id) への外部キー（Supabase SQL で定義） */
  userId: uuid("user_id").unique().notNull(),
  /** Stripe の Customer ID（`cus_...`） */
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
    .unique()
    .notNull(),
  /** 作成日時 */
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type StripeCustomer = typeof stripeCustomers.$inferSelect;
export type NewStripeCustomer = typeof stripeCustomers.$inferInsert;

/**
 * 有料プランの購入記録 — 期間パスと買い切り
 * 購入
 *
 * @description
 * Stripe Checkout（一括払い）が完了するごとに 1 行。特典の判定
 * （`lib/entitlements/has-benefit.ts`）は「取り消されておらず、期限内か
 * 永久の行の `benefits` の和集合」で決まる。契約状態（サブスクリプション）
 * は持たない — 期間パスは `expires_at` が来れば自然に失効し、買い切りは
 * NULL で永久。
 *
 * @design `benefits` は購入時点のスナップショット
 *
 * 「買い切りは購入時点の特典に限定する」を実装する列。コードのプラン定義
 * （`lib/billing/plans.ts`）に特典を足しても、過去の購入行には付かない。
 * 期間パスも同じ規則で揃える（数十日の残期間に新特典が付かないだけで、
 * 例外を作るより単純）。
 *
 * @design 冪等キーは `stripe_checkout_session_id`
 *
 * Checkout 完了の着地（Route Handler）と Webhook の両方が同じ購入を
 * 記録しようとする。UNIQUE + ON CONFLICT DO NOTHING で、どちらが先でも
 * 1 行になる。`stripe_payment_intent_id` は返金（`charge.refunded`）から
 * 購入行を引くためのキー。
 *
 * @design 金額と通貨は Stripe の値をそのまま保存
 *
 * 価格表をコードに持たない（Stripe の Price が正）。`amount` は最小通貨
 * 単位（JPY は円そのまま、USD はセント）。表示は `currency` に応じて
 * `Intl.NumberFormat` に任せる。
 *
 * @design 取り消し（`revoked_at`）は論理削除
 *
 * 返金や不正で特典を止めるときは行を消さず `revoked_at` を立てる。
 * 購入履歴には「返金済み」として残る。
 *
 * @design `user_id` → auth.users の FK は Supabase SQL で定義（CASCADE）
 *
 * 退会で行は消える。返金はしない（規約に明記）。Stripe 側の顧客と決済記録
 * は会計のため残る。
 */
export const purchases = pgTable(
  "purchases",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** auth.users(id) への外部キー（Supabase SQL で定義） */
    userId: uuid("user_id").notNull(),
    /** プラン（`lib/billing/plans.ts` の `PlanKey`） */
    plan: varchar("plan", { length: 50 }).notNull(),
    /** 売り方（`PurchaseKind`）。`pass` = 期間パス、`lifetime` = 買い切り */
    kind: varchar("kind", { length: 20 }).notNull(),
    /** 購入時点で付与した特典（`PlanBenefit` の値）。空にしない */
    benefits: text("benefits").array().notNull(),
    /** Checkout Session ID（`cs_...`）。冪等キー */
    stripeCheckoutSessionId: varchar("stripe_checkout_session_id", {
      length: 255,
    })
      .unique()
      .notNull(),
    /** PaymentIntent ID（`pi_...`）。返金イベントから引くキー */
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    })
      .unique()
      .notNull(),
    /** 通貨（ISO 4217 小文字。Stripe の表記に合わせる） */
    currency: varchar("currency", { length: 3 }).notNull(),
    /** 支払額（最小通貨単位） */
    amount: integer("amount").notNull(),
    /** 特典の開始。パスの重ね買いでは前のパスの期限の後ろに繋ぐ */
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    /** 特典の終了。買い切りは NULL（永久） */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** 取り消し日時（返金・不正）。NULL なら有効 */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    /** 取り消し理由（`PurchaseRevokeReason`）。`revoked_at` と対で入る */
    revokeReason: varchar("revoke_reason", { length: 50 }),
    /** 作成日時 */
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_purchases_user_expires").on(table.userId, table.expiresAt),
    check("purchases_chk_kind", sql`${table.kind} IN ('pass', 'lifetime')`),
    check(
      "purchases_chk_lifetime_has_no_expiry",
      sql`(${table.kind} = 'lifetime') = (${table.expiresAt} IS NULL)`,
    ),
    check(
      "purchases_chk_revoke_reason_pairs_with_revoked_at",
      sql`(${table.revokedAt} IS NULL) = (${table.revokeReason} IS NULL)`,
    ),
    check(
      "purchases_chk_benefits_not_empty",
      sql`cardinality(${table.benefits}) > 0`,
    ),
    check("purchases_chk_amount_non_negative", sql`${table.amount} >= 0`),
    check("purchases_chk_currency", sql`${table.currency} ~ '^[a-z]{3}$'`),
  ],
);

export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;

/**
 * 処理済みの Stripe Webhook イベント
 * Webhookイベント
 *
 * @description
 * Stripe は同じイベントを複数回届けることがある（再送・並行配信）。
 * 処理の先頭で `event.id` をここに INSERT し、衝突したら何もせず 200 を
 * 返すことで二重処理を防ぐ。行は 1 購入あたり数件しか増えないため、
 * 掃除は必要になってから考える。
 */
export const stripeWebhookEvents = pgTable("stripe_webhook_events", {
  /** Stripe の Event ID（`evt_...`） */
  eventId: varchar("event_id", { length: 255 }).primaryKey(),
  /** イベント種別（`checkout.session.completed` 等） */
  eventType: varchar("event_type", { length: 100 }).notNull(),
  /** 受信日時 */
  receivedAt: timestamp("received_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
