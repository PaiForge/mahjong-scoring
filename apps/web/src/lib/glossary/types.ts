import type { CompletedMentsu, HaiKindId } from "@mahjong-scoring/core";

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
 * 用語に添える例の共通部分
 */
interface GlossaryTermExampleBase {
  /**
   * 牌の下に添える短い注記のキー（`glossary.captions.<key>`）。
   * 注記が要らない例では省く。実在するキーかは
   * `glossary-i18n-integrity.test.ts` が検査する。
   */
  readonly captionKey?: string;
}

/**
 * 牌を並べて見せる例
 * 用語の例示牌
 *
 * 牌の種類（么九牌・風牌など）や、面子に切り出せない形（雀頭・待ちの形・
 * 14 枚の手牌）を見せるための並び。
 */
export interface GlossaryTilesExample extends GlossaryTermExampleBase {
  /** 並べる牌。左から順に描画する */
  readonly tiles: readonly HaiKindId[];
}

/**
 * 面子 1 つを卓上の並びで見せる例
 * 用語の例示面子
 *
 * 明刻・明槓は鳴いた 1 枚を横向きに、暗槓は両端を伏せて置く。この並びは
 * 面子そのものから決まるので、牌の位置ではなく面子を持たせる。牌を裸で
 * 並べると中張牌の明刻と暗刻が同じ絵になってしまう。
 */
export interface GlossaryMentsuExample extends GlossaryTermExampleBase {
  readonly mentsu: CompletedMentsu;
}

/**
 * 用語に添える例
 * 用語の例示
 *
 * 語の定義だけでは形が伝わらない用語（順子・両面・暗槓など）に、実物を
 * 並べて見せる。牌そのものが説明なので、文章の言い換えを captionKey に
 * 入れないこと（「順子の例」ではなく「萬子の 2・3・4」のように、その並びが
 * 何であるかを補う）。
 */
export type GlossaryTermExample = GlossaryTilesExample | GlossaryMentsuExample;

/** 面子として並べる例か（`tiles` の例と描き分ける） */
export function isMentsuExample(
  example: GlossaryTermExample,
): example is GlossaryMentsuExample {
  return "mentsu" in example;
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
