import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
import { KANA_ROWS, kanaAnchorId, kanaRowOf, type KanaRow } from "./kana";

/**
 * 用語集の索引の行（言語ごと）
 * 用語集索引行
 *
 * 用語集の「五十音から探す」は、日本語では五十音の行（あ行・か行 …）、英語では
 * 見出し語の頭文字（A〜Z）で引く。五十音は日本語の読みにしか無く、英語の読者に
 * 「か行」を見せても引けないため、行の集合そのものを言語で切り替える。
 *
 * 辞書のキー（`glossary.kanaIndexTitle`・`glossary.kanaRowHeading`）は日本語と
 * 形を揃えるため名前を変えず、英語の値だけ「Alphabetical」「{row}」にする。
 * 日本語の判定・並び・アンカー id は `kana.ts` に委譲し、1 文字も変えない。
 */

/** 英語の索引の行（見出し語の頭文字） */
export const ALPHA_ROWS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

export type AlphaRow = (typeof ALPHA_ROWS)[number];

/** 用語集の索引の行（日本語は五十音、英語は頭文字） */
export type GlossaryIndexRow = KanaRow | AlphaRow;

const alphaRowSet: ReadonlySet<string> = new Set(ALPHA_ROWS);

function isAlphaRow(value: string): value is AlphaRow {
  return alphaRowSet.has(value);
}

/**
 * その言語の索引に並べる行を、並び順どおりに返す
 * 索引行一覧
 *
 * 語の無い行も含めて常に全行を返す（行が抜けると「無いのか、飛ばされたのか」が
 * 分からなくなるため、ナビは語の無い行を薄い文字で残す）。
 *
 * @param locale - 用語集を出している言語
 */
export function indexRowsFor(
  locale: SupportedLocale,
): readonly GlossaryIndexRow[] {
  return locale === DEFAULT_LOCALE ? KANA_ROWS : ALPHA_ROWS;
}

/**
 * 用語がその言語の索引のどの行に入るかを返す
 * 索引行判定
 *
 * - 日本語: 読み（カタカナ）の 1 文字目の五十音行（{@link kanaRowOf}）
 * - 英語: 見出し語（英語の語）の 1 文字目を大文字にした英字。英語の読み
 *   （ヘボン式のローマ字）ではなく見出し語で引く — 英語の一覧に出ているのは
 *   見出し語（`Pair`）で、読み（`jantou`）は添え書きだから
 *
 * どの行にも当たらない語（空文字・数字や記号で始まる語）は undefined を返し、
 * 呼び出し側が行見出しから外す。
 *
 * @param term - その言語の見出し語（例: "Pair"）
 * @param reading - その言語の読み（例: "メンツ" / "mentsu"）
 * @param locale - 用語集を出している言語
 */
export function indexRowOf(
  term: string,
  reading: string,
  locale: SupportedLocale,
): GlossaryIndexRow | undefined {
  if (locale === DEFAULT_LOCALE) return kanaRowOf(reading);
  const head = term.charAt(0).toUpperCase();
  return isAlphaRow(head) ? head : undefined;
}

/**
 * 索引の行見出しに付けるアンカー id を返す
 * 索引行アンカー
 *
 * 日本語の行は {@link kanaAnchorId} と同じ値（`kana-ka`）で、既存の
 * `#kana-ka` の飛び先を変えない。英語の行は同じ系の `alpha-a`。
 *
 * @param row - 対象の行
 */
export function indexAnchorId(row: GlossaryIndexRow): string {
  return isAlphaRow(row) ? `alpha-${row.toLowerCase()}` : kanaAnchorId(row);
}
