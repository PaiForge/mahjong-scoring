import {
  chaptersInSection,
  sortChapterSlugs,
  type CurriculumChapterSlug,
} from "../curriculum/registry";
import {
  RANK_REGISTRY,
  RANK_SLUGS,
  rankBySlug,
  type RankSlug,
} from "../ranks/registry";
import {
  listedPracticeMenus,
  relatedChaptersForPractice,
  type PracticeCategory,
} from "./catalog";
import { practiceRanks } from "./rank-practices";

/**
 * 練習一覧の絞り込み条件 — 段級位か分野のどちらか一方
 * 一覧の絞り込み
 *
 * @design 2 軸を掛け合わせない理由
 *
 * 級と分野は直交していない（4級 = 符の計算、5級 = 翻数 + 点数計算の一部）。
 * 2 軸の AND にすると 4級 × 翻数 のように 0 件になる組み合わせが過半を占め、
 * 操作の半分が空の一覧に着地する。選べるのは常に 1 つだけにして、どれを
 * 押しても必ず 1 件以上残るようにしている。
 */
export type PracticeListFilter =
  | { readonly kind: "rank"; readonly value: RankSlug }
  | { readonly kind: "category"; readonly value: PracticeCategory };

/**
 * 絞り込みが無いときに出す件数。練習一覧の主役は練習のカードなので、
 * レッスンと級は抜粋に留め、続きは目次・道場へのリンクで送る
 */
export const PRACTICE_LIST_GUIDE_LIMIT = 3;

/** 絞り込みが無ければ先頭だけに縮める */
function excerpt<T>(
  items: readonly T[],
  filter: PracticeListFilter | undefined,
): readonly T[] {
  return filter === undefined
    ? items.slice(0, PRACTICE_LIST_GUIDE_LIMIT)
    : items;
}

/**
 * 練習一覧の下に並べるレッスン
 * 一覧のレッスン
 *
 * - 級で絞ったとき: その級の前提章（`learnChapterSlugs`）。道場と級の詳細が
 *   出すのと同じ集合で、同じ級に別のレッスンの組を見せない
 * - 分野で絞ったとき: その分野の練習の関連章（`relatedChaptersForPractice`）を
 *   畳んだもの。練習の説明ページの「関連するレッスン」と同じ出どころ
 * - 絞り込みが無いとき: 全練習の関連章の先頭 {@link PRACTICE_LIST_GUIDE_LIMIT} 件
 *
 * どれもカリキュラムの順に並べる。
 *
 * @param filter 一覧の絞り込み。undefined なら絞り込みなし
 */
export function practiceListChapters(
  filter: PracticeListFilter | undefined,
): readonly CurriculumChapterSlug[] {
  if (filter?.kind === "rank") {
    const chapters = rankBySlug(filter.value)?.learnChapterSlugs ?? [];
    return excerpt(sortChapterSlugs(new Set(chapters)), filter);
  }
  const menus = listedPracticeMenus().filter(
    (menu) => filter === undefined || menu.category === filter.value,
  );
  const related = new Set(
    menus.flatMap((menu) => relatedChaptersForPractice(menu.slug)),
  );
  return excerpt(sortChapterSlugs(related), filter);
}

/**
 * 練習一覧の下に並べる段級位
 * 一覧の段級位
 *
 * - 級で絞ったとき: その級だけ
 * - 分野で絞ったとき: その分野の練習が属する級（`practiceRanks`）
 * - 絞り込みが無いとき: 5級から先頭 {@link PRACTICE_LIST_GUIDE_LIMIT} 級
 *
 * どれもレジストリの順（学習順）に並べる。
 *
 * @param filter 一覧の絞り込み。undefined なら絞り込みなし
 */
export function practiceListRanks(
  filter: PracticeListFilter | undefined,
): readonly RankSlug[] {
  if (filter?.kind === "rank") return excerpt([filter.value], filter);
  if (filter === undefined) return excerpt(RANK_SLUGS, filter);
  const ranks = new Set(
    listedPracticeMenus()
      .filter((menu) => menu.category === filter.value)
      .flatMap((menu) => practiceRanks(menu.slug)),
  );
  return excerpt(
    RANK_SLUGS.filter((slug) => ranks.has(slug)),
    filter,
  );
}

/**
 * 実戦練習（和了形・聴牌形の点数計算）の下に並べるレッスン
 * 実戦練習のレッスン
 *
 * 「点数の計算」セクションの章。和了形の点数計算の説明ページが「関連する
 * レッスン」に出すのと同じ集合で、どの章も本文からその練習へ送っている。
 */
export function practicalPracticeChapters(): readonly CurriculumChapterSlug[] {
  return chaptersInSection("score");
}

/**
 * 実戦練習の下に並べる段級位
 * 実戦練習の段級位
 *
 * 前提章に「点数の計算」セクションの章を最初に持つ級から上のすべて
 * （3級〜初段）。実戦練習は点数計算をひととおり身につけた先にあるので、
 * どの級を取れば実戦の力になるかを並べる。前提章だけで判定しないのは、
 * 初段が新しい章を持たず（合格基準は「どんな場合でも点数計算ができること」）、
 * 前提章だけでは落ちるため。級ごとに書き並べず、レジストリから導く。
 */
export function practicalPracticeRanks(): readonly RankSlug[] {
  const scoreChapters = new Set(practicalPracticeChapters());
  const first = RANK_REGISTRY.findIndex((rank) =>
    rank.learnChapterSlugs.some((slug) => scoreChapters.has(slug)),
  );
  return first === -1 ? [] : RANK_SLUGS.slice(first);
}
