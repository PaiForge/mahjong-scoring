import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import type { PracticeCategory } from "@mahjong-scoring/features/practice/catalog";
import {
  DEFAULT_VARIANT,
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { variantQuery } from "@mahjong-scoring/features/routes";
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

/**
 * 練習一覧の絞り込み条件 — 段級位か分野のどちらか一方
 * 一覧の絞り込み
 *
 * @design 2 軸を掛け合わせない理由
 *
 * 級と分野は直交していない（4級 = 符の計算、5級 = 翻数 + 点数計算の一部）。
 * 2 軸の AND にすると 4級 × 翻数 のように 0 件になる組み合わせが過半を占め、
 * 操作の半分が空の一覧に着地する。選べるのは常に 1 つだけにして、どれを
 * 押しても必ず 1 件以上残るようにしている。
 */
export type PracticeListFilter =
  | { readonly kind: "rank"; readonly value: RankSlug }
  | { readonly kind: "category"; readonly value: PracticeCategory };

/**
 * 練習一覧のパス。絞り込みを渡すとその条件で絞った状態で開く。
 * 練習一覧パス
 *
 * @param filter 絞り込み条件。省略すると絞り込みなし
 */
export function practiceListHref(filter?: PracticeListFilter): string {
  if (filter === undefined) return "/practice";
  const param =
    filter.kind === "rank" ? PRACTICE_RANK_PARAM : PRACTICE_CATEGORY_PARAM;
  return `/practice?${param}=${filter.value}`;
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
 * @param menu 判定する練習の段級位と分野
 */
export function matchesPracticeFilter(
  filter: PracticeListFilter | undefined,
  menu: { readonly rank?: RankSlug; readonly category: PracticeCategory },
): boolean {
  if (filter === undefined) return true;
  return filter.kind === "rank"
    ? menu.rank === filter.value
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
