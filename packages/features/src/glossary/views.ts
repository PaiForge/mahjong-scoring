import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";

import { kanaRowOf, type KanaRow } from "./kana";
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
  /** 読み（例: "メンツ"）。五十音の並び順と行見出しの根拠 */
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
  /** 五十音行。読みがどの行にも当たらないときは undefined */
  readonly kanaRow: KanaRow | undefined;
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
 * 一覧と用語ページの両方がこの形を作る。読みは五十音行の根拠でもあるので、
 * 辞書から 1 度引いた値を `reading` と `kanaRow` の両方に使う。
 */
function toGlossaryTermView(
  term: GlossaryTerm,
  t: GlossaryTranslator,
): GlossaryTermView {
  const reading = t(`terms.${term.slug}.reading`);
  return {
    ...term,
    term: t(`terms.${term.slug}.term`),
    reading,
    definition: t(`terms.${term.slug}.definition`),
    usage: t(`terms.${term.slug}.usage`),
    caseStudy: t(`terms.${term.slug}.caseStudy`),
    pitfall: t(`terms.${term.slug}.pitfall`),
    kanaRow: kanaRowOf(reading),
    href: glossaryTermHref(term.slug),
  };
}

/** 読み順（五十音）で並べ替える */
function byReading(a: GlossaryTermView, b: GlossaryTermView): number {
  return a.reading.localeCompare(b.reading, "ja");
}

/**
 * すべての用語を読み順で返す
 * 用語一覧
 *
 * 一覧（五十音・分類の両方）と、関連語の解決がここを通る。
 */
export function glossaryTermViews(
  t: GlossaryTranslator,
): readonly GlossaryTermView[] {
  return GLOSSARY_TERMS.map((term) => toGlossaryTermView(term, t)).sort(
    byReading,
  );
}

/**
 * slug から表示用語を返す
 * 表示用語
 *
 * @param slug 対象用語のスラッグ（URL 由来の未検証の文字列でよい）
 * @returns 該当する用語。未知の slug なら undefined
 */
export function glossaryTermViewBySlug(
  slug: string,
  t: GlossaryTranslator,
): GlossaryTermView | undefined {
  const term = getGlossaryTermBySlug(slug);
  return term === undefined ? undefined : toGlossaryTermView(term, t);
}

/**
 * 用語リンクを押したときに出すプレビューを返す
 * 用語プレビュー
 *
 * 未知の slug は undefined（呼び出し側は素のテキストへ degrade する）。
 * 辞書に綴り違いを書いても、リンクが消えるだけで画面は壊れない。
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
