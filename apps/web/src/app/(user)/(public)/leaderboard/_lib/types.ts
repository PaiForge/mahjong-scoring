import type { PracticeMenuType } from '@/lib/db/practice-menu-types';
import { PRACTICE_MENU_TYPES } from '@/lib/db/practice-menu-types';
import type { RankedLeaderboardRow } from '@/lib/db/challenge-queries';

/**
 * リーダーボード期間
 * ランキング表示の期間種別
 */
export type LeaderboardPeriod = 'all-time' | 'monthly';

export const VALID_PERIODS = ['all-time', 'monthly'] as const satisfies readonly LeaderboardPeriod[];

/**
 * リーダーボードモジュール
 * ドリル種別（DB のスネークケース表記）
 */
export type LeaderboardModule = PracticeMenuType;

/**
 * リーダーボードモジュールスラッグ
 * URL 用のケバブケース表記
 */
export type LeaderboardModuleSlug =
  | 'jantou-fu'
  | 'machi-fu'
  | 'mentsu-fu'
  | 'tehai-fu'
  | 'yaku';

export const MODULES: readonly LeaderboardModule[] = PRACTICE_MENU_TYPES;

export type LeaderboardRow = RankedLeaderboardRow;

/**
 * リーダーボード結果
 * ランキングの取得結果
 */
export interface LeaderboardResult {
  readonly rows: readonly LeaderboardRow[];
  readonly totalCount: number;
  readonly currentUserRank: LeaderboardRow | undefined;
}

/**
 * ユーザーランク情報
 * 一覧ページでカードに表示するランク情報
 */
export interface UserRankInfo {
  readonly module: LeaderboardModule;
  readonly rank: number;
}

export const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// URL slug <-> DB module name conversion
// ---------------------------------------------------------------------------

const MODULE_TO_SLUG: Record<LeaderboardModule, LeaderboardModuleSlug> = {
  jantou_fu: 'jantou-fu',
  machi_fu: 'machi-fu',
  mentsu_fu: 'mentsu-fu',
  tehai_fu: 'tehai-fu',
  yaku: 'yaku',
};

const SLUG_TO_MODULE: Record<LeaderboardModuleSlug, LeaderboardModule> = {
  'jantou-fu': 'jantou_fu',
  'machi-fu': 'machi_fu',
  'mentsu-fu': 'mentsu_fu',
  'tehai-fu': 'tehai_fu',
  yaku: 'yaku',
};

/**
 * モジュール名からURLスラッグへ変換する
 * モジュール→スラッグ変換
 */
export function moduleToSlug(module: LeaderboardModule): LeaderboardModuleSlug {
  return MODULE_TO_SLUG[module];
}

function isModuleSlug(value: string): value is LeaderboardModuleSlug {
  return value in SLUG_TO_MODULE;
}

/**
 * URLスラッグからモジュール名へ変換する
 * スラッグ→モジュール変換
 */
export function slugToModule(slug: string): LeaderboardModule | undefined {
  if (!isModuleSlug(slug)) return undefined;
  return SLUG_TO_MODULE[slug];
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
  return `/practice/${slug}/play`;
}
