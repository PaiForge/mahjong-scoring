/**
 * 練習種別の型定義と変換ユーティリティ
 *
 * チャレンジモード（ランキング対応）の練習種別を定義する。
 * `challenge_results` / `challenge_best_scores` テーブルの `menu_type` カラムに格納される値。
 *
 * @description 新しい練習種別の追加は `PRACTICE_MENU_REGISTRY` に1行追加するだけでよい。
 * slug（URL 用ケバブケース）・messageKey（i18n 用キャメルケース）・namespace
 * （練習ページの辞書セクション）はレジストリから自動導出される。
 *
 * @design menuType — 練習種別
 *
 * - 'jantou_fu': 雀頭の符計算
 * - 'machi_fu': 待ちの符計算
 * - 'mentsu_fu': 面子の符計算
 * - 'tehai_fu': 手牌の符計算
 * - 'total_fu': 手牌の合計符
 * - 'yaku': 役判定
 * - 'score_table': 点数表早引き
 * - 'score_calculation': 点数計算練習
 * - 'han_count': 翻数即答
 * - 'yaku_han': 役の翻数
 * - 'mangan_score_calculation': 満貫以上の点数計算
 *
 * `practice/score` は自由練習のため記録対象外。
 */

// ---------------------------------------------------------------------------
// Registry — single source of truth
// ---------------------------------------------------------------------------

/**
 * 練習種別レジストリエントリ
 * menuType（DB snake_case）・slug（URL kebab-case）・messageKey（i18n camelCase）・
 * namespace（練習ページの辞書セクション）を束ねる
 *
 * `messageKey` と `namespace` は別物である点に注意:
 * - `messageKey`: 練習名の一覧的な参照に使う共通キー。
 *   `practice.practices.<messageKey>` / `mypage.challenges.menuTypes.<messageKey>` /
 *   `leaderboard.module.<messageKey>` から引かれる。
 * - `namespace`: その練習専用の辞書セクション。`<namespace>.title` が練習名、
 *   配下に問題文や選択肢のラベルが入る。チャレンジ系は `〜Challenge` で終わる。
 */
interface PracticeMenuEntry {
  readonly menuType: string;
  readonly slug: string;
  readonly messageKey: string;
  readonly namespace: string;
}

/**
 * 練習種別レジストリ
 * 新しい練習の追加はここに1行追加するだけでよい。
 */
const PRACTICE_MENU_REGISTRY = [
  {
    menuType: "jantou_fu",
    slug: "jantou-fu",
    messageKey: "jantouFu",
    namespace: "jantouFu",
  },
  {
    menuType: "machi_fu",
    slug: "machi-fu",
    messageKey: "machiFu",
    namespace: "machiFu",
  },
  {
    menuType: "mentsu_fu",
    slug: "mentsu-fu",
    messageKey: "mentsuFu",
    namespace: "mentsuFu",
  },
  {
    menuType: "tehai_fu",
    slug: "tehai-fu",
    messageKey: "tehaiFu",
    namespace: "tehaiFu",
  },
  {
    menuType: "total_fu",
    slug: "total-fu",
    messageKey: "totalFu",
    namespace: "totalFu",
  },
  { menuType: "yaku", slug: "yaku", messageKey: "yaku", namespace: "yaku" },
  {
    menuType: "score_table",
    slug: "score-table",
    messageKey: "scoreTable",
    namespace: "scoreTableChallenge",
  },
  {
    menuType: "score_calculation",
    slug: "score-calculation",
    messageKey: "scoreCalculation",
    namespace: "scoreCalculationChallenge",
  },
  {
    menuType: "han_count",
    slug: "han-count",
    messageKey: "hanCount",
    namespace: "hanCountChallenge",
  },
  {
    menuType: "yaku_han",
    slug: "yaku-han",
    messageKey: "yakuHan",
    namespace: "yakuHanChallenge",
  },
  {
    menuType: "mangan_score_calculation",
    slug: "mangan-score-calculation",
    messageKey: "manganScoreCalculation",
    namespace: "manganScoreCalculationChallenge",
  },
] as const satisfies readonly PracticeMenuEntry[];

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

/** 練習種別（DB snake_case） */
export type PracticeMenuType =
  (typeof PRACTICE_MENU_REGISTRY)[number]["menuType"];

/** 練習種別スラッグ（URL kebab-case） */
export type PracticeMenuSlug = (typeof PRACTICE_MENU_REGISTRY)[number]["slug"];

/**
 * i18n メッセージキー用の camelCase 識別子。
 * DB の snake_case `PracticeMenuType` を i18n の camelCase キーに変換する際に使用する。
 */
export type PracticeMenuMessageKey =
  (typeof PRACTICE_MENU_REGISTRY)[number]["messageKey"];

/** 練習ページの i18n 名前空間（`<namespace>.title` が練習名） */
export type PracticeMenuNamespace =
  (typeof PRACTICE_MENU_REGISTRY)[number]["namespace"];

/**
 * 練習種別の全情報
 * 練習種別記述子
 */
export interface PracticeMenuDescriptor {
  readonly menuType: PracticeMenuType;
  readonly slug: PracticeMenuSlug;
  readonly messageKey: PracticeMenuMessageKey;
  readonly namespace: PracticeMenuNamespace;
}

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

/** 全練習種別の配列（DB snake_case） */
export const PRACTICE_MENU_TYPES: readonly PracticeMenuType[] =
  PRACTICE_MENU_REGISTRY.map((e) => e.menuType);

/** 全練習種別スラッグの配列（URL kebab-case） */
export const PRACTICE_MENU_SLUGS: readonly PracticeMenuSlug[] =
  PRACTICE_MENU_REGISTRY.map((e) => e.slug);

const practiceMenuTypeSet: ReadonlySet<string> = new Set(PRACTICE_MENU_TYPES);

/** 値が有効な練習種別かを判定する型ガード */
export function isPracticeMenuType(value: unknown): value is PracticeMenuType {
  return typeof value === "string" && practiceMenuTypeSet.has(value);
}

// ---------------------------------------------------------------------------
// Lookup maps (built from registry)
// ---------------------------------------------------------------------------

const menuTypeToSlugMap = new Map<PracticeMenuType, PracticeMenuSlug>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, e.slug]),
);

const slugToMenuTypeMap = new Map<PracticeMenuSlug, PracticeMenuType>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.slug, e.menuType]),
);

const menuTypeToMessageKeyMap = new Map<
  PracticeMenuType,
  PracticeMenuMessageKey
>(PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, e.messageKey]));

const slugToDescriptorMap = new Map<PracticeMenuSlug, PracticeMenuDescriptor>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.slug, e]),
);

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** DB の snake_case 練習種別を URL スラッグ（kebab-case）に変換する */
export function menuTypeToSlug(menuType: PracticeMenuType): PracticeMenuSlug {
  const slug = menuTypeToSlugMap.get(menuType);
  if (slug === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return slug;
}

const practiceMenuSlugSet: ReadonlySet<string> = new Set(PRACTICE_MENU_SLUGS);

/** 値が有効な練習種別スラッグ（URL kebab-case）かを判定する型ガード */
export function isPracticeMenuSlug(value: string): value is PracticeMenuSlug {
  return practiceMenuSlugSet.has(value);
}

/** URL スラッグ（kebab-case）を DB の snake_case 練習種別に変換する */
export function slugToMenuType(slug: string): PracticeMenuType | undefined {
  if (!isPracticeMenuSlug(slug)) return undefined;
  return slugToMenuTypeMap.get(slug);
}

/** DB の snake_case 練習種別を i18n メッセージキー（camelCase）に変換する */
export function menuTypeToMessageKey(
  menuType: PracticeMenuType,
): PracticeMenuMessageKey {
  const key = menuTypeToMessageKeyMap.get(menuType);
  if (key === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return key;
}

/**
 * URL スラッグから練習種別の全情報を取得する
 * 練習種別記述子取得
 *
 * 練習ページを組み立てるファクトリー（本体・結果・ローディング）は、
 * 各練習から slug だけを受け取り、menuType や i18n 名前空間はここから引く。
 * 同じ組み合わせを練習ごとに何度も書かないための入口。
 */
export function practiceMenuBySlug(
  slug: PracticeMenuSlug,
): PracticeMenuDescriptor {
  const descriptor = slugToDescriptorMap.get(slug);
  if (descriptor === undefined) {
    throw new Error(`Unknown PracticeMenuSlug: ${slug}`);
  }
  return descriptor;
}

/**
 * 練習結果を sessionStorage に保存する際のキーを導出する
 * 結果ストレージキー
 *
 * `<slug>-results` 形式。各練習の _lib/types.ts に手書きすると
 * slug 変更時に追随漏れが起きるため、レジストリの slug から導出する。
 */
export function resultStorageKeyFor(slug: PracticeMenuSlug): string {
  return `${slug}-results`;
}
