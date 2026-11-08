import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import { LESSON_SCORE_PRACTICES } from "@mahjong-scoring/features/practice/score/lesson-practices";

import { scorePracticePlayHref } from "../../practice/agari-score/_lib/play-href";

/** カタログ外の練習への導線 1 つ */
export interface FreePracticeLink {
  /** 行き先（和了形の点数計算の絞り込み付き play） */
  readonly href: string;
  /** ボタンの文言の辞書キー（名前空間付き） */
  readonly labelKey: string;
}

/**
 * 章に対応する、カタログ外の練習（和了形の点数計算の絞り込み）への導線
 * 章の自由練習リンク
 *
 * 絞り込みの中身はアプリと共有する（`LESSON_SCORE_PRACTICES`）。ここでは
 * web の行き先（クエリ付きの play）に組み立てるだけ。パスの組み立ては
 * web の和了形の点数計算に結び付くので、features ではなくここに置く。
 */
export const FREE_PRACTICE_LINKS: Readonly<
  Partial<Record<CurriculumChapterSlug, FreePracticeLink>>
> = Object.fromEntries(
  Object.entries(LESSON_SCORE_PRACTICES).map(([slug, { pick, labelKey }]) => [
    slug,
    { href: scorePracticePlayHref(pick), labelKey },
  ]),
);
