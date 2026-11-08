import {
  DISPLAY_TIERS,
  MANGAN_MIN_HAN,
  hanRangeOf,
} from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";

/**
 * 学習ページで満貫の下限として示す翻数
 * 満貫の表示下限
 *
 * 早見表（`HIGH_SCORES.han`）は「この翻数なら符に関係なくこの点数」を示すため
 * 満貫を 5 翻からとするが、学習ページは「満貫になる翻数」を教えるため 4 翻から示す。
 * 4 翻でも符が高ければ（40 符以上で基本符 2000 以上）満貫になるため。
 */
const MANGAN_DISPLAY_MIN_HAN = MANGAN_MIN_HAN - 1;

/**
 * 言語ごとの翻数レンジの書式
 *
 * - `ja` — `6 〜 7`（上限なしは `13 〜`）。日本語のページの表示はこの形で固定
 *   （テストが 1 文字まで固定する）
 * - `en` — `6–7`（en dash、前後に空白を置かない英語の範囲の慣用）、上限なしは
 *   `13+`。英語のページに全角の波ダッシュ（日本語の文字）を残さないため
 */
const RANGE_FORMATTERS: Readonly<
  Record<SupportedLocale, (min: number, max: number | undefined) => string>
> = {
  ja: (min, max) => {
    if (max === undefined) return `${min} 〜`;
    return min === max ? `${min}` : `${min} 〜 ${max}`;
  },
  en: (min, max) => {
    if (max === undefined) return `${min}+`;
    return min === max ? `${min}` : `${min}–${max}`;
  },
};

function buildHanDisplay(
  locale: SupportedLocale,
): Readonly<Record<string, string>> {
  const format = RANGE_FORMATTERS[locale];
  return Object.fromEntries(
    DISPLAY_TIERS.map((tier) => {
      const range = hanRangeOf(tier.key);
      const min = tier.key === "mangan" ? MANGAN_DISPLAY_MIN_HAN : range?.min;
      return [tier.key, format(min ?? tier.minHan, range?.max)];
    }),
  );
}

const HAN_DISPLAY_BY_LOCALE: Readonly<
  Record<SupportedLocale, Readonly<Record<string, string>>>
> = {
  ja: buildHanDisplay("ja"),
  en: buildHanDisplay("en"),
};

/**
 * 満貫以上の種類ごとの翻数レンジ表示（言語別）
 * 言語別翻数レンジ表示
 *
 * 翻数は core の区分テーブルから導出する。キーは `HIGH_SCORES` の
 * nameKey と一致する。満貫のみ下限を {@link MANGAN_DISPLAY_MIN_HAN} で
 * 上書きする（早見表との差はここ1箇所だけ）。数値はどの言語でも同じで、
 * 範囲の書式（区切りの記号）だけが言語で変わる。
 *
 * @param locale - 表示するページの言語
 */
export function hanDisplayFor(
  locale: SupportedLocale,
): Readonly<Record<string, string>> {
  return HAN_DISPLAY_BY_LOCALE[locale];
}

/**
 * 満貫以上の種類ごとの翻数レンジ表示（日本語）
 * 翻数レンジ表示
 *
 * `hanDisplayFor(DEFAULT_LOCALE)` と同じ値。日本語しか出さない読み手
 * （モバイルの満貫の表）のための互換の export。言語を持つページは
 * {@link hanDisplayFor} を使う。
 */
export const HAN_DISPLAY: Readonly<Record<string, string>> =
  hanDisplayFor(DEFAULT_LOCALE);
