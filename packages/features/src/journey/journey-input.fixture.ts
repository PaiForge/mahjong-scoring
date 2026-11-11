// 行程のテスト（`journey.test.ts`・`journey-progress.test.ts`）が共有する、
// `buildJourney()` の入力の組み立てと代表的な進み具合。テスト専用で、アプリからは読まない。

import { DEFAULT_VARIANT } from "../practice-menu-types";
import { RANK_REGISTRY, type RankSlug } from "../ranks/registry";
import type { BuildJourneyInput, PracticeAttempt } from "./journey";

/**
 * 何も終えていない集合（レッスンの完了が無い状態）
 * 空集合
 */
export const NONE: ReadonlySet<string> = new Set();

/**
 * 練習に一度も挑戦していない状態
 * 挑戦なし
 */
export const NO_ATTEMPTS: readonly PracticeAttempt[] = [];

/**
 * 段級位を 1 つも持っていない状態
 * 段級位なし
 */
export const NO_RANKS: readonly RankSlug[] = [];

/**
 * 行程の入力を組み立てる。既定は「何も終えていない登録直後」で、検証したい項目だけ上書きする
 * 行程入力フィクスチャ
 *
 * @param overrides - 既定から差し替える項目
 */
export function input(
  overrides: Partial<BuildJourneyInput> = {},
): BuildJourneyInput {
  return {
    completedLessonSlugs: NONE,
    attemptedPractices: NO_ATTEMPTS,
    achievedRankSlugs: NO_RANKS,
    ...overrides,
  };
}

/**
 * 5級の前提章（レッスン）をすべて終えた状態
 * 5級レッスン完了
 */
export const KYU5_LESSONS_DONE: ReadonlySet<string> = new Set(
  RANK_REGISTRY[0].learnChapterSlugs,
);

/**
 * 5級の章から送っている練習に、章が指す土俵ですべて挑戦した状態
 * 5級練習挑戦済み
 */
export const KYU5_PRACTICES_ATTEMPTED: readonly PracticeAttempt[] = [
  { slug: "score-table", variant: "ko_mangan_plus" },
  { slug: "score-table", variant: "oya_mangan_plus" },
  { slug: "mangan-score-calculation", variant: DEFAULT_VARIANT },
  { slug: "yaku-han", variant: "no_kuisagari" },
  { slug: "yaku", variant: DEFAULT_VARIANT },
  { slug: "han-count", variant: DEFAULT_VARIANT },
];
