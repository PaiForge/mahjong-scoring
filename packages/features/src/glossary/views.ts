import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";

import { DEFAULT_LOCALE, type SupportedLocale } from "../i18n/locales";
import { indexRowOf, type GlossaryIndexRow } from "./index-rows";
import {
  GLOSSARY_TERMS,
  getGlossaryTermBySlug,
  isGlossaryTermSlug,
  type GlossaryTerm,
  type GlossaryTermSlug,
} from "./registry";
import { glossaryTermHref } from "./routes";
import { isMentsuExample } from "./types";

/**
 * `glossary` 名前空間の翻訳関数
 *
 * 辞書の引き方はプラットフォームが渡す（web はサーバーの `getTranslations`、
 * モバイルは use-intl の `useTranslations`）。
 */
export type GlossaryTranslator = (key: string) => string;

/**
 * 文言を解決済みの用語
 * 表示用語
 *
 * 構造（{@link GlossaryTerm}）に辞書由来の見出し語・読み・定義と、用語ページの
 * 3 節（点数計算での扱い・具体例・よくある誤解）を重ねた形。
 * 一覧・用語ページ・モーダルはすべてこの形を受け取る。
 *
 * 3 節はすべての用語が持つ（`glossary-i18n-integrity.test.ts` が検査する）。
 * 定義 1〜2 文だけの用語ページは検索側に「薄いページ」と判断され、64 ページ分が
 * サイト全体の評価を下げていたため、語ごとに符・翻・点数への関わりまで書く。
 */
export interface GlossaryTermView extends GlossaryTerm {
  /** 見出し語（例: "面子"） */
  readonly term: string;
  /**
   * 読み（例: "メンツ"。英語はヘボン式のローマ字 "mentsu"）。日本語では
   * 五十音の並び順と行見出しの根拠
   */
  readonly reading: string;
  readonly definition: string;
  /**
   * 点数計算での扱い。その語が符・翻・点数にどう関わるかを、定義とは別に
   * 具体的な数字で述べる（用語ページだけが出す。モーダルの要約には載せない）
   */
  readonly usage: string;
  /** 具体例で見る。実際の牌や手で、その語の扱いを 1〜3 例示す */
  readonly caseStudy: string;
  /** よくある誤解。初学者が取り違えやすい点を正す */
  readonly pitfall: string;
  /**
   * 索引の行（日本語は読みの五十音行、英語は見出し語の頭文字。
   * `index-rows.ts` の `indexRowOf`）。どの行にも当たらないときは undefined
   */
  readonly indexRow: GlossaryIndexRow | undefined;
  readonly href: string;
}

/**
 * プレビューに載せる例 1 組
 *
 * 用語データの例（{@link GlossaryTermExample}）から注記だけを解決した形。
 * 面子の例は牌の位置ではなく面子のまま渡す（並びは描画側の `Furo` が決める）。
 */
export type GlossaryTermPreviewExample = { readonly caption?: string } & (
  | { readonly tiles: readonly HaiKindId[] }
  | { readonly mentsu: CompletedMentsu }
);

/**
 * モーダルに埋め込む軽量な用語データ
 * 用語プレビュー
 *
 * 教本本文の用語リンクを押したときに出すぶんだけを持つ。SSR の HTML に
 * そのまま載せるため、クライアントから取りに行く往復が要らない。
 * 例示牌は 1 組だけ — 残りは用語ページで見せる。
 */
export interface GlossaryTermPreview {
  readonly slug: GlossaryTermSlug;
  readonly term: string;
  readonly reading: string;
  readonly definition: string;
  readonly href: string;
  readonly example?: GlossaryTermPreviewExample;
}

/**
 * 用語の構造に辞書の文言を重ねて表示用語にする
 * 表示用語変換
 *
 * 一覧と用語ページの両方がこの形を作る。見出し語と読みは索引の行の根拠でも
 * あるので、辞書から 1 度引いた値を表示と `indexRow` の両方に使う。
 */
function toGlossaryTermView(
  term: GlossaryTerm,
  t: GlossaryTranslator,
  locale: SupportedLocale,
): GlossaryTermView {
  const heading = t(`terms.${term.slug}.term`);
  const reading = t(`terms.${term.slug}.reading`);
  return {
    ...term,
    term: heading,
    reading,
    definition: t(`terms.${term.slug}.definition`),
    usage: t(`terms.${term.slug}.usage`),
    caseStudy: t(`terms.${term.slug}.caseStudy`),
    pitfall: t(`terms.${term.slug}.pitfall`),
    indexRow: indexRowOf(heading, reading, locale),
    href: glossaryTermHref(term.slug),
  };
}

/**
 * その言語の索引の並び順で比べる関数を返す
 *
 * 日本語は読み（カタカナ）の五十音順。英語は見出し語の英字順 — 英語の索引は
 * 見出し語の頭文字で行を分ける（`indexRowOf`）ので、行の中も見出し語で並べないと
 * 行と並びが食い違う。
 */
function compareFor(
  locale: SupportedLocale,
): (a: GlossaryTermView, b: GlossaryTermView) => number {
  if (locale === DEFAULT_LOCALE) {
    return (a, b) => a.reading.localeCompare(b.reading, locale);
  }
  return (a, b) => a.term.localeCompare(b.term, locale);
}

/**
 * すべての用語をその言語の索引の順で返す
 * 用語一覧
 *
 * 一覧（索引・分類の両方）と、関連語の解決がここを通る。`locale` を省くと
 * 日本語（読みの五十音順・五十音行）で、モバイル（辞書は日本語固定）はこの形で呼ぶ。
 *
 * @param t - `glossary` 名前空間の翻訳関数（`locale` と同じ言語の辞書）
 * @param locale - 用語集を出している言語（省略時は日本語）
 */
export function glossaryTermViews(
  t: GlossaryTranslator,
  locale: SupportedLocale = DEFAULT_LOCALE,
): readonly GlossaryTermView[] {
  return GLOSSARY_TERMS.map((term) => toGlossaryTermView(term, t, locale)).sort(
    compareFor(locale),
  );
}

/**
 * slug から表示用語を返す
 * 表示用語
 *
 * @param slug 対象用語のスラッグ（URL 由来の未検証の文字列でよい）
 * @param t - `glossary` 名前空間の翻訳関数
 * @param locale - 用語集を出している言語（省略時は日本語）
 * @returns 該当する用語。未知の slug なら undefined
 */
export function glossaryTermViewBySlug(
  slug: string,
  t: GlossaryTranslator,
  locale: SupportedLocale = DEFAULT_LOCALE,
): GlossaryTermView | undefined {
  const term = getGlossaryTermBySlug(slug);
  return term === undefined ? undefined : toGlossaryTermView(term, t, locale);
}

/**
 * 用語リンクを押したときに出すプレビューを返す
 * 用語プレビュー
 *
 * 未知の slug は undefined（呼び出し側は素のテキストへ degrade する）。
 * 辞書に綴り違いを書いても、リンクが消えるだけで画面は壊れない。
 * 言語に依らない（索引の行を持たず、`t` が引く辞書の言語で文言が決まる。
 * `href` はロケール非依存のパスで、言語の接頭辞は描く側が付ける）。
 * 例示は 1 組だけ — 残りは用語ページで見せる。
 */
export function glossaryTermPreview(
  slug: string,
  t: GlossaryTranslator,
): GlossaryTermPreview | undefined {
  if (!isGlossaryTermSlug(slug)) return undefined;
  const term = getGlossaryTermBySlug(slug);
  if (term === undefined) return undefined;

  const [example] = term.examples ?? [];
  return {
    slug,
    term: t(`terms.${slug}.term`),
    reading: t(`terms.${slug}.reading`),
    definition: t(`terms.${slug}.definition`),
    href: glossaryTermHref(slug),
    ...(example
      ? {
          example: {
            ...(isMentsuExample(example)
              ? { mentsu: example.mentsu }
              : { tiles: example.tiles }),
            ...(example.captionKey
              ? { caption: t(`captions.${example.captionKey}`) }
              : {}),
          },
        }
      : {}),
  };
}
