import { DISPLAY_TIERS, hanRangeOf } from "@mahjong-scoring/core";

/**
 * 学習ページで満貫の下限として示す翻数
 * 満貫の表示下限
 *
 * 早見表（`HIGH_SCORES.han`）は「この翻数なら符に関係なくこの点数」を示すため
 * 満貫を 5 翻からとするが、学習ページは「満貫になる翻数」を教えるため 4 翻から示す。
 * 4 翻でも符が高ければ（40 符以上で基本符 2000 以上）満貫になるため。
 */
const MANGAN_DISPLAY_MIN_HAN = 4;

/** "6 〜 7" 形式のレンジ表示を組み立てる（上限なしは "13 〜"） */
function formatRange(min: number, max: number | undefined): string {
  if (max === undefined) return `${min} 〜`;
  return min === max ? `${min}` : `${min} 〜 ${max}`;
}

/**
 * 満貫以上の種類ごとの翻数レンジ表示
 * 翻数レンジ表示
 *
 * 翻数は core の区分テーブルから導出する。キーは `HIGH_SCORES` の
 * nameKey と一致する。満貫のみ下限を {@link MANGAN_DISPLAY_MIN_HAN} で
 * 上書きする（早見表との差はここ1箇所だけ）。
 */
export const HAN_DISPLAY: Readonly<Record<string, string>> = Object.fromEntries(
  DISPLAY_TIERS.map((tier) => {
    const range = hanRangeOf(tier.key);
    const min = tier.key === "mangan" ? MANGAN_DISPLAY_MIN_HAN : range?.min;
    return [tier.key, formatRange(min ?? tier.minHan, range?.max)];
  }),
);
