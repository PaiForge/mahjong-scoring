import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import type {
  PracticeMenuType,
  PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import {
  PRACTICE_MENU_TYPES,
  isExamMenuType,
  menuTypeToSlug,
  practiceMenuBySlug,
  practiceMenuByType,
  resolvePracticeVariant,
  slugToMenuType,
} from "@/lib/db/practice-menu-types";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";
import {
  practicePlayHref,
  practiceHref,
} from "@/app/(user)/(public)/practice/_lib/practice-catalog";
import { VARIANT_PARAM } from "@/app/(user)/(public)/practice/_lib/variant-param";

/**
 * リーダーボード期間
 * ランキング表示の期間種別
 */
export type LeaderboardPeriod = "all-time" | "monthly";

export const VALID_PERIODS = [
  "all-time",
  "monthly",
] as const satisfies readonly LeaderboardPeriod[];

/**
 * リーダーボードモジュール
 * 練習種別（DB のスネークケース表記）
 */
export type LeaderboardModule = PracticeMenuType;

/**
 * リーダーボードモジュールスラッグ
 * URL 用のケバブケース表記
 */
export type LeaderboardModuleSlug = PracticeMenuSlug;

/**
 * ランキングを持つ練習種別（一覧の並び順そのもの）
 * ランキング対象
 *
 * 昇級試験は含まない。試験の成果は段級位（`RANK_REGISTRY`）という恒久的な
 * 記録で表現されるものなので、同じ成績をランキングにも並べると達成の物差しが
 * 2 本になる。加えて試験はミス1回で終了するためスコアが合格ライン付近に
 * 詰まりやすく、母集団も受験資格を満たした人に限られるため、順位が実力の
 * 順序を表さない。
 *
 * 一覧（`LeaderboardTopContent`）と自分の順位の一括取得（`getUserRanks`）は
 * どちらもここを唯一の出所にしている。詳細ページの URL を塞ぐのは
 * {@link import("./validators").isValidModule}。
 */
export const MODULES: readonly LeaderboardModule[] = PRACTICE_MENU_TYPES.filter(
  (menuType) => !isExamMenuType(menuType),
);

/**
 * ランキングの土俵 — 練習種別と出題設定のバリアントの組
 * ランキング土俵
 *
 * 記録は (menuType, leaderboardKey) 単位に積まれ、ランキングも同じ単位で
 * 引く。バリアントを持つ練習は設定ごとに難易度が違うため、同じ練習でも
 * 別の土俵になる（子だけの点数表と全部の点数表を同じ順位表に並べない）。
 * 設定を持たない練習の `variant` は `DEFAULT_VARIANT`。
 */
export interface LeaderboardBoard {
  readonly module: LeaderboardModule;
  /** 出題設定のバリアント（= `leaderboard_key`） */
  readonly variant: string;
}

/**
 * ランキングを持つ土俵の一覧（一覧の並び順そのもの）
 * ランキング土俵一覧
 *
 * 練習の並びは {@link MODULES}、その中のバリアントの並びはレジストリの列挙順。
 */
export const BOARDS: readonly LeaderboardBoard[] = MODULES.flatMap((module) =>
  practiceMenuByType(module).variants.map((variant) => ({ module, variant })),
);

/**
 * 土俵を 1 つの文字列キーにする（Map のキー・React の key 用）
 * 土俵キー
 */
export function boardKey(board: LeaderboardBoard): string {
  return `${board.module}:${board.variant}`;
}

/**
 * URL のスラッグとクエリから土俵を復元する
 * 土俵解決
 *
 * バリアントは `resolvePracticeVariant` で正規化する（未指定・不正値は
 * その練習の既定）。練習がランキングを持たない（昇級試験）・未知なら undefined
 */
export function resolveBoard(
  moduleSlug: string,
  rawVariant: string | undefined,
): LeaderboardBoard | undefined {
  const resolvedModule = slugToModule(moduleSlug);
  if (resolvedModule === undefined || !MODULES.includes(resolvedModule)) {
    return undefined;
  }
  return {
    module: resolvedModule,
    variant: resolvePracticeVariant(menuTypeToSlug(resolvedModule), rawVariant),
  };
}

/**
 * リーダーボード結果
 * ランキングの取得結果
 */
export interface LeaderboardResult {
  readonly rows: readonly RankedLeaderboardRow[];
  readonly totalCount: number;
  readonly currentUserRank: RankedLeaderboardRow | undefined;
}

/**
 * ユーザーランク情報
 * 一覧ページでカードに表示するランク情報
 */
export interface UserRankInfo extends LeaderboardBoard {
  readonly rank: number;
}

/** 1ページあたりの表示件数（アプリ共通の既定値に揃える） */
export const PAGE_SIZE = DEFAULT_PAGE_SIZE;

// ---------------------------------------------------------------------------
// URL slug <-> DB module name conversion
// Delegates to the central registry in practice-menu-types.ts
// ---------------------------------------------------------------------------

/**
 * モジュール名からURLスラッグへ変換する
 * モジュール→スラッグ変換
 */
export function moduleToSlug(module: LeaderboardModule): LeaderboardModuleSlug {
  return menuTypeToSlug(module);
}

/**
 * URLスラッグからモジュール名へ変換する
 * スラッグ→モジュール変換
 */
export function slugToModule(slug: string): LeaderboardModule | undefined {
  return slugToMenuType(slug);
}

/**
 * 詳細ページのパスを構築する
 * 詳細パス構築
 */
export function buildDetailPath(
  period: LeaderboardPeriod,
  board: LeaderboardBoard,
): string {
  const slug = moduleToSlug(board.module);
  const base = `/leaderboard/${period}/${slug}`;
  // バリアントを持つ練習だけクエリで土俵を指す。持たない練習に付けても
  // 意味が無く、URL が長くなるだけ
  return practiceMenuBySlug(slug).hasSetup
    ? `${base}?${VARIANT_PARAM}=${encodeURIComponent(board.variant)}`
    : base;
}

/**
 * チャレンジページのパスを構築する
 * チャレンジパス構築
 *
 * その土俵のバリアントで play を開く（URL はレジストリの basePath が持つ）。
 */
export function buildChallengePath(board: LeaderboardBoard): string {
  return practicePlayHref(moduleToSlug(board.module), board.variant);
}

/**
 * 練習の説明ページのパス（ランキングから練習へ戻る導線用）
 * 練習パス構築
 */
export function buildPracticePath(board: LeaderboardBoard): string {
  return practiceHref(moduleToSlug(board.module), board.variant);
}
