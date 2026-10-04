import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

/** レッスン一覧のパス */
export const LESSON_LIST_PATH = "/lessons";

/**
 * レッスン一覧のパス。級を渡すとその級の節（`#kyu-5`）へのアンカー付き。
 * レッスン一覧パス
 *
 * 一覧は全レッスンを級ごとの節に並べた 1 ページで、級で絞り込みはしない
 * （レッスンは十数個で、全体が見えている方が「どこまで来たか」が分かる）。
 * 節の id は級のスラッグそのもの。アンカーは web の画面構成に結び付くため、
 * モバイルと共有するパス（features の `routes.ts`）には置かない。
 */
export function lessonListHref(rank?: RankSlug): string {
  return rank === undefined ? LESSON_LIST_PATH : `${LESSON_LIST_PATH}#${rank}`;
}
