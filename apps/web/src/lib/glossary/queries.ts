import { getTranslations } from "next-intl/server";

import type { HaiKindId } from "@mahjong-scoring/core";

import { kanaRowOf, type KanaRow } from "./kana";
import {
  GLOSSARY_TERMS,
  getGlossaryTermBySlug,
  isGlossaryTermSlug,
  type GlossaryTerm,
  type GlossaryTermSlug,
} from "./registry";
import { glossaryTermHref } from "./routes";

/**
 * 文言を解決済みの用語
 * 表示用語
 *
 * 構造（{@link GlossaryTerm}）に辞書由来の見出し語・読み・定義を重ねた形。
 * 一覧・用語ページ・モーダルはすべてこの形を受け取る。
 */
export interface GlossaryTermView extends GlossaryTerm {
  /** 見出し語（例: "面子"） */
  readonly term: string;
  /** 読み（例: "メンツ"）。五十音の並び順と行見出しの根拠 */
  readonly reading: string;
  readonly definition: string;
  /** 五十音行。読みがどの行にも当たらないときは undefined */
  readonly kanaRow: KanaRow | undefined;
  readonly href: string;
}

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
  readonly example?: {
    readonly tiles: readonly HaiKindId[];
    readonly faceDownIndexes?: readonly number[];
    readonly caption?: string;
  };
}

/** 読み順（五十音）で並べ替える */
function byReading(a: GlossaryTermView, b: GlossaryTermView): number {
  return a.reading.localeCompare(b.reading, "ja");
}

/**
 * すべての用語を読み順で返す。
 * 用語一覧取得
 *
 * 一覧ページ（五十音・分類の両方）と、関連語・プレビューの解決がここを通る。
 */
export async function getGlossaryTermViews(): Promise<
  readonly GlossaryTermView[]
> {
  const t = await getTranslations("glossary");

  return GLOSSARY_TERMS.map((term) => {
    const reading = t(`terms.${term.slug}.reading`);
    return {
      ...term,
      term: t(`terms.${term.slug}.term`),
      reading,
      definition: t(`terms.${term.slug}.definition`),
      kanaRow: kanaRowOf(reading),
      href: glossaryTermHref(term.slug),
    };
  }).sort(byReading);
}

/**
 * slug から表示用語を取得する。
 * 表示用語取得
 *
 * @param slug 対象用語のスラッグ（URL 由来の未検証の文字列でよい）
 * @returns 該当する用語。未知の slug なら undefined。
 */
export async function getGlossaryTermViewBySlug(
  slug: string,
): Promise<GlossaryTermView | undefined> {
  const term = getGlossaryTermBySlug(slug);
  if (!term) return undefined;

  const t = await getTranslations("glossary");
  const reading = t(`terms.${term.slug}.reading`);

  return {
    ...term,
    term: t(`terms.${term.slug}.term`),
    reading,
    definition: t(`terms.${term.slug}.definition`),
    kanaRow: kanaRowOf(reading),
    href: glossaryTermHref(term.slug),
  };
}

/**
 * 指定した slug 群のプレビューを slug をキーにして返す。
 * 用語プレビュー解決
 *
 * 未知の slug は黙って落とす（呼び出し側は素のテキストへ degrade する）。
 * 辞書に綴り違いを書いても、リンクが消えるだけでページは壊れない。
 *
 * @param slugs 本文が参照している用語スラッグ（重複可）
 */
export async function resolveTermPreviews(
  slugs: readonly string[],
): Promise<Record<string, GlossaryTermPreview>> {
  const known = [...new Set(slugs)].filter(isGlossaryTermSlug);
  if (known.length === 0) return {};

  const t = await getTranslations("glossary");
  const previews: Record<string, GlossaryTermPreview> = {};

  for (const slug of known) {
    const term = getGlossaryTermBySlug(slug);
    if (!term) continue;

    const [example] = term.examples ?? [];
    previews[slug] = {
      slug,
      term: t(`terms.${slug}.term`),
      reading: t(`terms.${slug}.reading`),
      definition: t(`terms.${slug}.definition`),
      href: glossaryTermHref(slug),
      ...(example
        ? {
            example: {
              tiles: example.tiles,
              ...(example.faceDownIndexes
                ? { faceDownIndexes: example.faceDownIndexes }
                : {}),
              ...(example.captionKey
                ? { caption: t(`captions.${example.captionKey}`) }
                : {}),
            },
          }
        : {}),
    };
  }

  return previews;
}
