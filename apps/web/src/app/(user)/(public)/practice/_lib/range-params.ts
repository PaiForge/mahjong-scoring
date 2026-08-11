/**
 * 点数帯絞り込みの URL パラメータ規約
 * 点数帯パラメータ
 *
 * 「満貫未満 / 満貫以上」は core の `ScoreRange` が唯一の型だが、
 * URL 上は短縮形（"non" / "plus"）を使う。その語彙とここでの解釈が
 * 唯一の定義で、各練習は結果を自分のジェネレータオプションへ組み立てる。
 */

/** 点数帯を指定するクエリパラメータ名 */
export const RANGE_PARAM = "ranges";

/** 満貫未満を表す URL トークン */
export const RANGE_TOKEN_NON_MANGAN = "non";

/** 満貫以上を表す URL トークン */
export const RANGE_TOKEN_MANGAN_PLUS = "plus";

/** 点数帯の絞り込み結果 */
export interface RangeSelection {
  readonly includeNonMangan: boolean;
  readonly includeManganPlus: boolean;
}

/**
 * `ranges` の値から点数帯の絞り込みを解釈する
 * 点数帯解釈
 *
 * 指定が1つも無ければ「全部含む」とみなす（ガイドからの遷移で
 * 一部の軸だけ指定されるケースを全選択として扱うため）。
 */
export function parseRangeValues(values: readonly string[]): RangeSelection {
  if (values.length === 0) {
    return { includeNonMangan: true, includeManganPlus: true };
  }
  return {
    includeNonMangan: values.includes(RANGE_TOKEN_NON_MANGAN),
    includeManganPlus: values.includes(RANGE_TOKEN_MANGAN_PLUS),
  };
}
