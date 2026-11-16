import {
  LESSON_CHAPTERS,
  type CurriculumChapter,
} from "@mahjong-scoring/features/curriculum/registry";

import type { LessonCompletionCountRow } from "./queries";

/**
 * レッスンの完了状況の並び順
 * 完了状況の並び順
 *
 * - `curriculum` — 順路順（既定）。「どこで離脱するか」に答える
 * - `total` — 累計の多い順。「どれが読まれてきたか」に答える
 * - `period` — 期間内の多い順。「最近どれが終えられているか」に答える
 *
 * @design 並びは URL の `sort` で切り替える
 * 画面では既存の `AdminTabs`（リンク）で選ぶ。クライアント側のソートにすると、
 * 共有した URL や再読み込みで同じ並びに戻れず、"use client" の部品も増える。
 * 多い順で同数のときは順路順に並べる（並びを毎回同じにする）。
 */
export const LESSON_STATS_SORTS = ["curriculum", "total", "period"] as const;
export type LessonStatsSort = (typeof LESSON_STATS_SORTS)[number];

/** 表の 1 行 */
export interface LessonStatRow {
  readonly slug: string;
  /** レジストリの章。undefined はレジストリに無い slug（廃止したレッスン等） */
  readonly chapter: CurriculumChapter | undefined;
  readonly total: number;
  readonly inPeriod: number;
}

/** 表に出す行と合計 */
export interface LessonStats {
  /** レジストリのレッスン（並びは sort）の後ろに、レジストリに無い slug（slug の昇順）が続く */
  readonly rows: readonly LessonStatRow[];
  /** 全行の total の最大（横棒の分母）。全部 0 なら 0 */
  readonly maxTotal: number;
  readonly totalCompletions: number;
  readonly periodCompletions: number;
}

/** 順路順のレッスン。定義順に頼らず `order` で並べ直す */
const LESSONS_IN_CURRICULUM_ORDER: readonly CurriculumChapter[] = [
  ...LESSON_CHAPTERS,
].sort((a, b) => a.order - b.order);

/**
 * 順路の番号（順路順で 1 始まり）。並び順を変えても同じレッスンは同じ番号
 * 順路番号
 *
 * @param chapter - レジストリの章。undefined（レジストリに無い slug）には番号が無い
 */
export function curriculumPositionOf(
  chapter: CurriculumChapter | undefined,
): number | undefined {
  if (chapter === undefined) return undefined;
  const index = LESSONS_IN_CURRICULUM_ORDER.indexOf(chapter);
  return index === -1 ? undefined : index + 1;
}

/**
 * DB の完了数を、レジストリのレッスンに沿った表の行と合計にまとめる
 * レッスン完了状況組み立て
 *
 * @design レジストリを正とし、完了 0 件のレッスンも 0 として並べる
 * 0 件のレッスンこそ「読まれていない」の答えなので落とせない。行の元は DB では
 * なくレジストリ（`LESSON_CHAPTERS`。コラムを除いた章）で、DB に行が無いレッスンは
 * 0 にする。
 *
 * @design レジストリに無い slug の行は捨てずに末尾へ出す
 * DB にあってレジストリに無い slug（廃止したレッスン、コラムの slug 等）は
 * `chapter: undefined` の行にして、並び順に関わらず末尾に slug の昇順で並べる。
 * 黙って落とすと合計が DB と合わず、原因を調べる手掛かりも消える。合計
 * （`totalCompletions` / `periodCompletions`）・`maxTotal` もこれらの行を含める。
 *
 * @param counts - `fetchLessonCompletionCounts` が返したレッスンごとの完了数
 * @param sort - 並び順
 */
export function buildLessonStats(
  counts: readonly LessonCompletionCountRow[],
  sort: LessonStatsSort,
): LessonStats {
  const countBySlug = new Map(counts.map((row) => [row.lessonSlug, row]));

  const lessonRows: LessonStatRow[] = LESSONS_IN_CURRICULUM_ORDER.map(
    (chapter) => {
      const count = countBySlug.get(chapter.slug);
      return {
        slug: chapter.slug,
        chapter,
        total: count?.total ?? 0,
        inPeriod: count?.inPeriod ?? 0,
      };
    },
  );
  if (sort !== "curriculum") {
    const key = sort === "total" ? "total" : "inPeriod";
    // Array.prototype.sort は安定なので、同数は元の順路順のまま残る
    lessonRows.sort((a, b) => b[key] - a[key]);
  }

  const registeredSlugs: ReadonlySet<string> = new Set(
    LESSONS_IN_CURRICULUM_ORDER.map((chapter) => chapter.slug),
  );
  const unknownRows: LessonStatRow[] = counts
    .filter((row) => !registeredSlugs.has(row.lessonSlug))
    .map((row) => ({
      slug: row.lessonSlug,
      chapter: undefined,
      total: row.total,
      inPeriod: row.inPeriod,
    }))
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));

  const rows = [...lessonRows, ...unknownRows];
  return {
    rows,
    maxTotal: rows.reduce((max, row) => Math.max(max, row.total), 0),
    totalCompletions: rows.reduce((sum, row) => sum + row.total, 0),
    periodCompletions: rows.reduce((sum, row) => sum + row.inPeriod, 0),
  };
}
