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
  slugToMenuType,
} from "@/lib/db/practice-menu-types";
import type { RankedLeaderboardRow } from "@/lib/db/leaderboard-queries";

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
export interface UserRankInfo {
  readonly module: LeaderboardModule;
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
  module: LeaderboardModule,
): string {
  return `/leaderboard/${period}/${moduleToSlug(module)}`;
}

/**
 * チャレンジページのパスを構築する
 * チャレンジパス構築
 */
export function buildChallengePath(module: LeaderboardModule): string {
  const slug = moduleToSlug(module);
  // URL はレジストリの basePath が持つ（`/practice/<slug>` を組み立てない）
  return `${practiceMenuBySlug(slug).basePath}/play`;
}
