import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";

import { scoreTablePracticeHref } from "../../practice/score-table/_lib/options";

/**
 * 学習カリキュラム — 章メタデータのレジストリ
 *
 * @description
 * `/learn/<slug>` 配下の章を順序付きで管理する単一の真実のソース。
 * 章の追加・削除・並び替えはこのファイル内で完結し、DB マイグレーションを
 * 必要としない（`learn_chapter_reads` は `chapter_slug` を文字列として保持）。
 *
 * @design i18nKey — 章タイトル等の翻訳キーの名前空間
 * 実際の文言は `ja.json` の `learnCurriculum.chapters.*` に置く。
 */

/** カリキュラムのセクション — 章をまとめる論理グループ */
export const CURRICULUM_SECTIONS = [
  "foundation",
  "mangan",
  "yaku",
  "fu",
  "score",
] as const;
export type CurriculumSection = (typeof CURRICULUM_SECTIONS)[number];

/**
 * 章メタデータの記述形式（型導出用）
 *
 * `slug` を `string` にしてあるのは、章スラッグの union を
 * {@link CURRICULUM_REGISTRY} から導出するため。公開する形は
 * {@link CurriculumChapter}。`lib/db/practice-menu-types.ts` と同じ組み方。
 */
interface CurriculumChapterEntry {
  readonly slug: string;
  readonly section: CurriculumSection;
  readonly order: number;
  readonly practiceHrefs?: readonly string[];
  /**
   * この章の読了が前提となる昇級試験（練習スラッグ）。
   * 章末に「昇級試験へ」の CTA を出す。`practiceHrefs`（読んだら解く練習）
   * とは意味が違うため別フィールドにしている。
   */
  readonly examSlug?: PracticeMenuSlug;
  readonly i18nKey: string;
}

/** 章メタデータのマスタ配列（order 昇順で並べる） */
const CURRICULUM_REGISTRY = [
  {
    slug: "about-this-app",
    section: "foundation",
    order: 10,
    i18nKey: "learnCurriculum.chapters.aboutThisApp",
  },
  {
    slug: "why-scoring-is-complex",
    section: "foundation",
    order: 20,
    i18nKey: "learnCurriculum.chapters.whyScoringIsComplex",
  },
  {
    slug: "mangan-ko-ron",
    section: "mangan",
    order: 21,
    practiceHrefs: [
      scoreTablePracticeHref({
        roles: ["ko"],
        wins: ["ron"],
        ranges: ["manganPlus"],
      }),
    ],
    i18nKey: "learnCurriculum.chapters.manganKoRon",
  },
  {
    slug: "mangan-oya-ron",
    section: "mangan",
    order: 22,
    practiceHrefs: [
      scoreTablePracticeHref({
        roles: ["oya"],
        wins: ["ron"],
        ranges: ["manganPlus"],
      }),
    ],
    i18nKey: "learnCurriculum.chapters.manganOyaRon",
  },
  {
    slug: "mangan-ko-tsumo",
    section: "mangan",
    order: 23,
    practiceHrefs: [
      scoreTablePracticeHref({
        roles: ["ko"],
        wins: ["tsumo"],
        ranges: ["manganPlus"],
      }),
    ],
    i18nKey: "learnCurriculum.chapters.manganKoTsumo",
  },
  {
    slug: "mangan-oya-tsumo",
    section: "mangan",
    order: 24,
    practiceHrefs: [
      scoreTablePracticeHref({
        roles: ["oya"],
        wins: ["tsumo"],
        ranges: ["manganPlus"],
      }),
    ],
    i18nKey: "learnCurriculum.chapters.manganOyaTsumo",
  },
  {
    slug: "yaku",
    section: "yaku",
    order: 25,
    practiceHrefs: [
      "/practice/yaku-han",
      "/practice/yaku",
      "/practice/han-count",
    ],
    // 満貫の章（役の前）と本章で5級試験の前提知識が揃う
    examSlug: "mangan-exam",
    i18nKey: "learnCurriculum.chapters.yaku",
  },
  {
    slug: "jantou-fu",
    section: "fu",
    order: 30,
    practiceHrefs: ["/practice/jantou-fu"],
    i18nKey: "learnCurriculum.chapters.jantouFu",
  },
  {
    slug: "mentsu-fu",
    section: "fu",
    order: 40,
    practiceHrefs: ["/practice/mentsu-fu"],
    i18nKey: "learnCurriculum.chapters.mentsuFu",
  },
  {
    slug: "machi-fu",
    section: "fu",
    order: 50,
    practiceHrefs: ["/practice/machi-fu"],
    i18nKey: "learnCurriculum.chapters.machiFu",
  },
  {
    slug: "tehai-fu",
    section: "fu",
    order: 60,
    practiceHrefs: ["/practice/mentsu-jantou-fu"],
    i18nKey: "learnCurriculum.chapters.tehaiFu",
  },
  {
    slug: "pinfu-score",
    section: "score",
    order: 70,
    // 対応する練習は自由練習（/practice/score の役絞り込み）だが、
    // practiceHrefs はカタログ登録済みの練習しか指せない（記録対象・
    // おすすめ導線の前提。practice-catalog.test.ts が固定している）。
    // 導線は章本文（pinfu-score-guide.tsx）の CTA が持つ
    i18nKey: "learnCurriculum.chapters.pinfuScore",
  },
  {
    slug: "chiitoitsu-score",
    section: "score",
    order: 80,
    // 平和の章と同じ理由で practiceHrefs を持たない（導線は
    // chiitoitsu-score-guide.tsx の CTA）
    i18nKey: "learnCurriculum.chapters.chiitoitsuScore",
  },
] as const satisfies readonly CurriculumChapterEntry[];

/** 章スラッグ — `/learn/<slug>` の slug 部分に対応 */
export type CurriculumChapterSlug =
  (typeof CURRICULUM_REGISTRY)[number]["slug"];

/** 1 章分のメタデータ */
export interface CurriculumChapter {
  readonly slug: CurriculumChapterSlug;
  readonly section: CurriculumSection;
  readonly order: number;
  readonly practiceHrefs?: readonly string[];
  /** この章の読了が前提となる昇級試験（練習スラッグ）。章末に CTA を出す */
  readonly examSlug?: PracticeMenuSlug;
  readonly i18nKey: string;
}

/** 章メタデータのマスタ配列（order 昇順で並べる） */
export const CURRICULUM: readonly CurriculumChapter[] = CURRICULUM_REGISTRY;

/** 章スラッグの一覧（CURRICULUM と同じ順序） */
export const CURRICULUM_CHAPTER_SLUGS: readonly CurriculumChapterSlug[] =
  CURRICULUM.map((chapter) => chapter.slug);

/**
 * order 昇順にソート済みの章配列。
 *
 * @remarks
 * `CURRICULUM` 自体はソース上で order 昇順に定義されているため通常は順序一致するが、
 * 将来 CURRICULUM の定義順序が崩れた場合でも API の振る舞いを安定させるために
 * モジュール読込時に 1 回だけソートしておく。
 */
const CURRICULUM_SORTED_BY_ORDER: readonly CurriculumChapter[] = [
  ...CURRICULUM,
].sort((a, b) => a.order - b.order);

/**
 * slug から CurriculumChapter を O(1) で引くための lookup map。
 * モジュール読込時に 1 回だけ構築される。
 */
const CURRICULUM_BY_SLUG: ReadonlyMap<
  CurriculumChapterSlug,
  CurriculumChapter
> = new Map(CURRICULUM.map((c) => [c.slug, c]));

/**
 * 章ページのパスを返す。
 * 章パス
 *
 * `/learn/<slug>` の組み立てをこの 1 箇所に閉じる。目次・前後章ナビ・練習からの
 * 導線がそれぞれ文字列を組み立てると、ルートを変えたときに追随漏れが出る。
 *
 * @param slug 対象章のスラッグ
 */
export function chapterHref(slug: CurriculumChapterSlug): string {
  return `/learn/${slug}`;
}

/**
 * slug から章メタデータを O(1) で取得する。
 * 章メタデータ取得
 *
 * @param slug 対象章のスラッグ
 * @returns 該当する章。slug が不正な場合は undefined。
 */
export function getChapterBySlug(
  slug: CurriculumChapterSlug,
): CurriculumChapter | undefined {
  return CURRICULUM_BY_SLUG.get(slug);
}

/**
 * 次に読むべき章を返す。order 昇順で readSlugs に含まれない最初の章。
 * 全章読了済の場合は undefined を返す。
 *
 * @param readSlugs 読了済み章スラッグの集合
 */
export function pickNextChapter(
  readSlugs: ReadonlySet<string>,
): CurriculumChapter | undefined {
  return CURRICULUM_SORTED_BY_ORDER.find((c) => !readSlugs.has(c.slug));
}

/**
 * 指定 slug の前後章を返す。
 * 指定 slug が存在しない場合は `{ prev: undefined, next: undefined }`。
 *
 * @param slug 対象章のスラッグ
 */
export function getAdjacentChapters(slug: CurriculumChapterSlug): {
  prev: CurriculumChapter | undefined;
  next: CurriculumChapter | undefined;
} {
  const idx = CURRICULUM_SORTED_BY_ORDER.findIndex((c) => c.slug === slug);
  if (idx === -1) return { prev: undefined, next: undefined };
  return {
    prev: CURRICULUM_SORTED_BY_ORDER[idx - 1],
    next: CURRICULUM_SORTED_BY_ORDER[idx + 1],
  };
}

/**
 * slug が curriculum に存在するかを判定（Server Action バリデーション用）。
 *
 * @param value 検査対象の値
 */
export function isCurriculumChapterSlug(
  value: unknown,
): value is CurriculumChapterSlug {
  return (
    typeof value === "string" &&
    (CURRICULUM_CHAPTER_SLUGS as readonly string[]).includes(value)
  );
}

/**
 * 章の i18n キーから "learnCurriculum." プレフィックスを剥がしたパスを返す。
 *
 * @example
 * const chapter = CURRICULUM[0];
 * // chapter.i18nKey === "learnCurriculum.chapters.aboutThisApp"
 * getChapterI18nPath(chapter); // "chapters.aboutThisApp"
 *
 * @remarks
 * next-intl の useTranslations("learnCurriculum") / getTranslations("learnCurriculum") スコープ内で
 * t(getChapterI18nPath(ch) + ".title") のように使う想定。
 * slug は kebab-case、i18n キーは camelCase という仕様のギャップを本関数で吸収する。
 *
 * @param chapter 対象の章メタデータ
 */
export function getChapterI18nPath(chapter: CurriculumChapter): string {
  const prefix = "learnCurriculum.";
  return chapter.i18nKey.startsWith(prefix)
    ? chapter.i18nKey.slice(prefix.length)
    : chapter.i18nKey;
}
