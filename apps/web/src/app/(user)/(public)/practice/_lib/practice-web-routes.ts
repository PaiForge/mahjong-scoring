import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import type { PracticeListFilter } from "@mahjong-scoring/features/practice/list-guides";
import type { PracticeCategory } from "@mahjong-scoring/features/practice/catalog";
import {
  DEFAULT_VARIANT,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { PRACTICE_PATH, variantQuery } from "@mahjong-scoring/features/routes";
import { PRACTICE_SETUP_HASH } from "./scroll-anchor";

/**
 * 練習ページの web 固有のパス
 * web 練習パス
 *
 * @description
 * 練習一覧の絞り込みクエリと、説明ページの出題設定セクションへの
 * アンカーを組み立てる。どちらも web の画面構成（一覧のフィルタ・
 * 説明ページ内のセクション）に結び付いているため、モバイルと共有する
 * パス（features の `routes.ts`）とは分けて置く。
 */

/**
 * 練習一覧の絞り込みを表すクエリパラメータ名。
 *
 * サーバーでは読まない（`searchParams` を読むとルートが動的になり、初回表示が
 * `loading.tsx` のスケルトンを経由する）。読むのは一覧のフィルタ
 * （`PracticeFilter`）だけで、それ以外はここを通してリンクを組み立てる。
 */
export const PRACTICE_RANK_PARAM = "rank";
export const PRACTICE_CATEGORY_PARAM = "category";

export type { PracticeListFilter } from "@mahjong-scoring/features/practice/list-guides";

/**
 * 練習一覧のパス。絞り込みを渡すとその条件で絞った状態で開く。
 * 練習一覧パス
 *
 * @param filter 絞り込み条件。省略すると絞り込みなし
 */
export function practiceListHref(filter?: PracticeListFilter): string {
  if (filter === undefined) return PRACTICE_PATH;
  const param =
    filter.kind === "rank" ? PRACTICE_RANK_PARAM : PRACTICE_CATEGORY_PARAM;
  return `${PRACTICE_PATH}?${param}=${filter.value}`;
}

/**
 * 絞り込み条件が同じものを指しているか。
 * 絞り込み比較
 *
 * トグルの選択状態（どのチップが現在地か）の判定に使う。
 */
export function isSamePracticeFilter(
  a: PracticeListFilter | undefined,
  b: PracticeListFilter | undefined,
): boolean {
  if (a === undefined || b === undefined) return a === b;
  return a.kind === b.kind && a.value === b.value;
}

/**
 * 練習が絞り込み条件に合致するか。条件が無ければすべて合致する。
 * 絞り込み判定
 *
 * @param filter 絞り込み条件
 * @param menu 判定する練習が属する段級位（`practiceRanks`）と分野
 */
export function matchesPracticeFilter(
  filter: PracticeListFilter | undefined,
  menu: {
    readonly ranks: readonly RankSlug[];
    readonly category: PracticeCategory;
  },
): boolean {
  if (filter === undefined) return true;
  return filter.kind === "rank"
    ? menu.ranks.includes(filter.value)
    : menu.category === filter.value;
}

/**
 * 練習の出題設定へのパス（説明ページの設定セクションへのアンカー付き）。
 * 出題設定パス
 *
 * 出題設定を持たない練習（レジストリの `hasSetup` が false）は undefined を返す。
 * 結果ページはこれが undefined なら「設定を変更する」ボタン自体を出さない。
 * `variant` を渡すと説明ページの選択パネルがそれを初期選択にする。
 */
export function practiceSetupHref(
  slug: PracticeMenuSlug,
  variant?: string,
): string | undefined {
  const { hasSetup, basePath } = practiceMenuBySlug(slug);
  if (!hasSetup) return undefined;
  return `${basePath}${variantQuery(slug, variant ?? DEFAULT_VARIANT)}${PRACTICE_SETUP_HASH}`;
}
