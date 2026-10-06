import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

/**
 * その級で絞った練習一覧のパス
 * 級別練習一覧パス
 *
 * web の `practiceListHref({ kind: "rank", value })` と同じ形
 * （`/practice?rank=<級>`）。web のこの関数は web 固有のパス
 * （一覧の絞り込みは画面構成に結び付く）なので features には無い。
 */
export function practiceListHrefForRank(slug: RankSlug): string {
  return `/practice?rank=${slug}`;
}
