import { isKuisagariEntry } from "@mahjong-scoring/core";
import type { YakuHanEntry } from "@mahjong-scoring/core";

/**
 * 鳴いたときの翻数の変わり方の区分
 * 鳴き区分
 *
 * - `menzenOnly`: 門前限定（鳴くと成立しない）
 * - `kuisagari`: 食い下がり（鳴くと 1 翻下がる）
 * - `unchanged`: 鳴いても翻数が変わらない
 *
 * レッスンの比較表（`yaku.learn.nakiKinds.<区分>`）と役一覧の絞り込み
 * （`reference.yaku.nakiFilters.<区分>`）の辞書キーに同じ文字列を使う。
 */
export const NakiKind = {
  MenzenOnly: "menzenOnly",
  Kuisagari: "kuisagari",
  Unchanged: "unchanged",
} as const;
export type NakiKind = (typeof NakiKind)[keyof typeof NakiKind];

/** 区分を並べる順（レッスンの本文が説明する順） */
export const NAKI_KIND_ORDER: readonly NakiKind[] = [
  NakiKind.MenzenOnly,
  NakiKind.Kuisagari,
  NakiKind.Unchanged,
];

/**
 * 役の鳴き区分を役のデータから決める
 * 鳴き区分判定
 *
 * @param entry - 役と翻数
 */
export function classifyNakiKind(entry: YakuHanEntry): NakiKind {
  if (entry.nakiHan === undefined) return NakiKind.MenzenOnly;
  return isKuisagariEntry(entry) ? NakiKind.Kuisagari : NakiKind.Unchanged;
}

/** 絞り込みなしを表す値 */
export const ALL_NAKI_KINDS = "all";

/**
 * 役一覧の絞り込みの値（すべて + 鳴き区分）
 * 鳴き絞り込み
 */
export type NakiFilter = typeof ALL_NAKI_KINDS | NakiKind;

/** 絞り込みの選択肢の並び（「すべて」が先頭） */
export const NAKI_FILTER_OPTIONS: readonly NakiFilter[] = [
  ALL_NAKI_KINDS,
  ...NAKI_KIND_ORDER,
];

/**
 * 役が絞り込みに当てはまるか
 * 鳴き絞り込み判定
 *
 * @param filter - 選択中の絞り込み
 * @param entry - 役と翻数
 */
export function matchesNakiFilter(
  filter: NakiFilter,
  entry: YakuHanEntry,
): boolean {
  return filter === ALL_NAKI_KINDS || classifyNakiKind(entry) === filter;
}
