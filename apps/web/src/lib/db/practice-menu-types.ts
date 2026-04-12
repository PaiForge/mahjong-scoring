/**
 * ドリル種別の型定義と変換ユーティリティ
 *
 * チャレンジモード（ランキング対応）のドリル種別を定義する。
 * `challenge_results` / `challenge_best_scores` テーブルの `menu_type` カラムに格納される値。
 *
 * @description 新しいドリル種別の追加は `PRACTICE_MENU_REGISTRY` に1行追加するだけでよい。
 * slug（URL 用ケバブケース）・messageKey（i18n 用キャメルケース）はレジストリから自動導出される。
 *
 * @design menuType — ドリル種別
 *
 * - 'jantou_fu': 雀頭の符計算
 * - 'machi_fu': 待ちの符計算
 * - 'mentsu_fu': 面子の符計算
 * - 'tehai_fu': 手牌の符計算
 * - 'yaku': 役判定
 * - 'score_table': 点数表早引き
 * - 'score_calculation': 点数計算ドリル
 * - 'han_count': 翻数即答
 *
 * `practice/score` は自由練習のため記録対象外。
 */

// ---------------------------------------------------------------------------
// Registry — single source of truth
// ---------------------------------------------------------------------------

/**
 * ドリル種別レジストリエントリ
 * menuType（DB snake_case）・slug（URL kebab-case）・messageKey（i18n camelCase）を束ねる
 */
interface PracticeMenuEntry {
  readonly menuType: string;
  readonly slug: string;
  readonly messageKey: string;
}

/**
 * ドリル種別レジストリ
 * 新しいドリルの追加はここに1行追加するだけでよい。
 */
const PRACTICE_MENU_REGISTRY = [
  { menuType: 'jantou_fu', slug: 'jantou-fu', messageKey: 'jantouFu' },
  { menuType: 'machi_fu', slug: 'machi-fu', messageKey: 'machiFu' },
  { menuType: 'mentsu_fu', slug: 'mentsu-fu', messageKey: 'mentsuFu' },
  { menuType: 'tehai_fu', slug: 'tehai-fu', messageKey: 'tehaiFu' },
  { menuType: 'yaku', slug: 'yaku', messageKey: 'yaku' },
  { menuType: 'score_table', slug: 'score-table', messageKey: 'scoreTable' },
  { menuType: 'score_calculation', slug: 'score-calculation', messageKey: 'scoreCalculation' },
  { menuType: 'han_count', slug: 'han-count', messageKey: 'hanCount' },
] as const satisfies readonly PracticeMenuEntry[];

// ---------------------------------------------------------------------------
// Derived types
// ---------------------------------------------------------------------------

/** ドリル種別（DB snake_case） */
export type PracticeMenuType = (typeof PRACTICE_MENU_REGISTRY)[number]['menuType'];

/** ドリル種別スラッグ（URL kebab-case） */
export type PracticeMenuSlug = (typeof PRACTICE_MENU_REGISTRY)[number]['slug'];

/**
 * i18n メッセージキー用の camelCase 識別子。
 * DB の snake_case `PracticeMenuType` を i18n の camelCase キーに変換する際に使用する。
 */
export type PracticeMenuMessageKey = (typeof PRACTICE_MENU_REGISTRY)[number]['messageKey'];

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

/** 全ドリル種別の配列（DB snake_case） */
export const PRACTICE_MENU_TYPES: readonly PracticeMenuType[] = PRACTICE_MENU_REGISTRY.map(
  (e) => e.menuType,
);

/** 全ドリル種別スラッグの配列（URL kebab-case） */
export const PRACTICE_MENU_SLUGS: readonly PracticeMenuSlug[] = PRACTICE_MENU_REGISTRY.map(
  (e) => e.slug,
);

const practiceMenuTypeSet: ReadonlySet<string> = new Set(PRACTICE_MENU_TYPES);

/** 値が有効なドリル種別かを判定する型ガード */
export function isPracticeMenuType(value: unknown): value is PracticeMenuType {
  return typeof value === 'string' && practiceMenuTypeSet.has(value);
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

const menuTypeToMessageKeyMap = new Map<PracticeMenuType, PracticeMenuMessageKey>(
  PRACTICE_MENU_REGISTRY.map((e) => [e.menuType, e.messageKey]),
);

// ---------------------------------------------------------------------------
// Conversion functions
// ---------------------------------------------------------------------------

/** DB の snake_case ドリル種別を URL スラッグ（kebab-case）に変換する */
export function menuTypeToSlug(menuType: PracticeMenuType): PracticeMenuSlug {
  const slug = menuTypeToSlugMap.get(menuType);
  if (slug === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return slug;
}

const practiceMenuSlugSet: ReadonlySet<string> = new Set(PRACTICE_MENU_SLUGS);

function isPracticeMenuSlug(value: string): value is PracticeMenuSlug {
  return practiceMenuSlugSet.has(value);
}

/** URL スラッグ（kebab-case）を DB の snake_case ドリル種別に変換する */
export function slugToMenuType(slug: string): PracticeMenuType | undefined {
  if (!isPracticeMenuSlug(slug)) return undefined;
  return slugToMenuTypeMap.get(slug);
}

/** DB の snake_case ドリル種別を i18n メッセージキー（camelCase）に変換する */
export function menuTypeToMessageKey(menuType: PracticeMenuType): PracticeMenuMessageKey {
  const key = menuTypeToMessageKeyMap.get(menuType);
  if (key === undefined) {
    throw new Error(`Unknown PracticeMenuType: ${menuType}`);
  }
  return key;
}
