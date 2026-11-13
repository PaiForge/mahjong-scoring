import type { GlossaryCategory } from "./types";
import type { GlossaryTermView } from "./views";

/**
 * 用語集の一覧の絞り込みの条件
 */
export interface GlossaryFilter {
  /** 検索の語（前後の空白は無視する。空なら絞り込まない） */
  readonly query: string;
  /** 分類。undefined は「すべて」 */
  readonly category: GlossaryCategory | undefined;
}

/**
 * 検索の語と突き合わせる形にそろえる
 *
 * 英字は小文字に、ひらがなはカタカナにする。日本語の読みはカタカナ
 * （「アンコー」）で持っているが、キーボードで打つのはひらがな（「あんこ」）の
 * ことが多いため。変換の確定前でも読みに当たる。
 */
function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (kana) =>
      String.fromCharCode(kana.charCodeAt(0) + 0x60),
    );
}

/**
 * 用語を検索の語と分類で絞り込む（並びは渡された順のまま）
 * 用語絞り込み
 *
 * 検索は見出し語・読み・slug（ローマ字）のどれかに語が含まれるものを残す。
 * 定義の本文は見ない — 多くの語の定義に出てくる語（「符」「面子」）で引くと
 * ほぼ全部が残り、探している語が埋もれる。
 *
 * @param terms 絞り込む前の用語
 * @param filter 検索の語と分類
 * @returns 条件に合う用語
 */
export function filterGlossaryTerms<T extends GlossaryTermView>(
  terms: readonly T[],
  filter: GlossaryFilter,
): readonly T[] {
  const query = normalize(filter.query);
  return terms.filter(
    (term) =>
      (filter.category === undefined || term.category === filter.category) &&
      (query === "" ||
        normalize(term.term).includes(query) ||
        normalize(term.reading).includes(query) ||
        term.slug.includes(query)),
  );
}
