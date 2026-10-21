import {
  CURRICULUM,
  LESSON_CHAPTERS,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";

/**
 * モバイルで本文を描けるレッスン（章）
 * 移植済みレッスン
 *
 * 章の一覧と順序は features の `curriculum/registry.ts` が正典で、ここは
 * 「その章をモバイルで開けるか」だけを持つ。載っていない章は目次に並ぶが
 * 開けず、本文中の章リンクも素の文字になる（今はすべての章を移植済み。章を
 * 足したときに本文を書くまでの間の受け皿）。本文は `guide-registry.tsx` が
 * この slug ごとに持つ。
 */
const PORTED_LESSON_SLUGS = [
  "about-this-app",
  "why-scoring-is-hard-to-learn",
  "why-scoring-is-complex",
  "mangan-ko-ron",
  "mangan-ko-tsumo",
  "mangan-oya-ron",
  "mangan-oya-tsumo",
  "yaku",
  "jantou-fu",
  "mentsu-fu",
  "machi-fu",
  "tehai-fu",
  "chiitoitsu-score",
  "pinfu-score",
  "menzen-mentsu-score",
  "furo-score",
  "fu-doubling",
  "ron-to-tsumo",
  "tsumo-payments",
] as const satisfies readonly CurriculumChapterSlug[];

/** モバイルで開けるレッスンの slug */
export type PortedLessonSlug = (typeof PORTED_LESSON_SLUGS)[number];

const portedSet: ReadonlySet<string> = new Set(PORTED_LESSON_SLUGS);

/**
 * 章をモバイルで開けるか
 * 移植済み判定
 *
 * @param slug 章の slug
 */
export function isLessonPorted(slug: string): slug is PortedLessonSlug {
  return portedSet.has(slug);
}

/**
 * モバイルで開けるレッスン（目次の順）
 * 移植済みレッスン一覧
 *
 * コラムは進捗に数えないので除く。進捗バーの分母はこれ（目次とホームの
 * 「レッスンの続き」で同じ数を出す）
 */
export const PORTED_LESSONS = LESSON_CHAPTERS.filter((chapter) =>
  isLessonPorted(chapter.slug),
);

/**
 * モバイルで開けない章の slug
 * 未移植の章
 *
 * 「次はここから」「レッスンの続き」の候補から外す
 */
export const UNPORTED_LESSON_SLUGS: readonly string[] = CURRICULUM.filter(
  (chapter) => !isLessonPorted(chapter.slug),
).map((chapter) => chapter.slug);

/**
 * 完了したレッスンのうち、モバイルで開けるものの数
 * 移植済みレッスンの完了数
 *
 * @param completedSlugs 完了したレッスン（章）
 */
export function countPortedCompleted(
  completedSlugs: ReadonlySet<string>,
): number {
  return PORTED_LESSONS.filter((chapter) => completedSlugs.has(chapter.slug))
    .length;
}
