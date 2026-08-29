import type { HaiKindId } from "@mahjong-scoring/core";

import type { CurriculumChapterSlug } from "@/app/(user)/(public)/learn/_lib/curriculum";

/**
 * 用語の分類
 * 用語カテゴリ
 *
 * 用語集の「分類から探す」の見出しになる。表示名は辞書
 * （`glossary.categories.<key>`）に置く。並び順は初学者が読む順
 * （牌 → 手牌の形 → 鳴き → アガリ → 符 → 点数）。
 */
export const GLOSSARY_CATEGORIES = [
  "hai",
  "tehai",
  "naki",
  "agari",
  "fu",
  "score",
] as const;

export type GlossaryCategory = (typeof GLOSSARY_CATEGORIES)[number];

/**
 * 用語に添える手牌の例
 * 用語の例示牌
 *
 * 語の定義だけでは形が伝わらない用語（順子・両面・暗槓など）に、実際の牌を
 * 並べて見せる。牌そのものが説明なので、文章の言い換えを captionKey に
 * 入れないこと（「順子の例」ではなく「萬子の 2・3・4」のように、その並びが
 * 何であるかを補う）。
 */
export interface GlossaryTermExample {
  /** 並べる牌。左から順に描画する */
  readonly tiles: readonly HaiKindId[];
  /** 裏向きで描画する位置（暗槓の両端など） */
  readonly faceDownIndexes?: readonly number[];
  /**
   * 牌の下に添える短い注記のキー（`glossary.captions.<key>`）。
   * 注記が要らない例では省く。実在するキーかは
   * `glossary-i18n-integrity.test.ts` が検査する。
   */
  readonly captionKey?: string;
}

/**
 * 用語 1 件の記述形式（型導出用）
 *
 * `slug` を `string` にしてあるのは、用語スラッグの union を
 * 用語データそのものから導出するため。公開する形は {@link GlossaryTerm}。
 * `learn/_lib/curriculum.ts` と同じ組み方。
 */
export interface GlossaryTermEntry {
  /** URL の `/reference/glossary/<slug>` に対応するローマ字スラッグ */
  readonly slug: string;
  readonly category: GlossaryCategory;
  readonly examples?: readonly GlossaryTermExample[];
  /** 併せて読むと理解が進む用語のスラッグ */
  readonly related?: readonly string[];
  /** この用語を扱っている教本の章。用語ページから章へ送る */
  readonly learnSlugs?: readonly CurriculumChapterSlug[];
}
