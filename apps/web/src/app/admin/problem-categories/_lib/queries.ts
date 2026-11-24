/**
 * 保存問題の分類の集計と一覧
 * 問題分類クエリ
 *
 * @description
 * 属性の表（`practice_problem_facet_sets` / `practice_problem_facets`）のうち、この
 * デプロイの採点の版で計算できた行（`currentOkFacetSet`）だけを読む。未計算・計算に
 * 失敗した問題はどの分類にも数えないので、ページは網羅の状況（計算済み成功 / 失敗 /
 * 未計算）を必ず一緒に出す。
 *
 * @design 分類ごとの件数は 1 クエリの `count(*) filter (where ...)` で数える
 * 分類の条件は「条件を満たす和了があるか」の EXISTS（`categoryCondition`）で、親の行
 * 1 つ = 問題 1 つを数える。分類の数だけクエリを投げない。和了形と聴牌形で意味が違う
 * （聴牌形は「どれかの和了が満たす」）ので、種別ごとに分けて数える。
 *
 * @design インデックスは足していない（既知のトレードオフ）
 * 親の行の走査 × 分類の数だけ子の主キーの照合になる。管理者がページを開いたときだけ
 * 走る集計で、遅さの実測も無い。行数とクエリを測ってから足す。
 *
 * 失敗は握りつぶさず throw のまま返す（「0 件」と「取得失敗」を取り違えないため）。
 */
import "server-only";

import { SCORING_VERSION } from "@mahjong-scoring/core";
import {
  PROBLEM_CATEGORIES,
  type ProblemCategory,
} from "@mahjong-scoring/features/problem-facets/categories";
import { and, asc, desc, eq, inArray, sql, type SQL } from "drizzle-orm";

import {
  db,
  practiceProblemFacetSets,
  practiceProblemFacets,
  practiceProblems,
  type PracticeProblem,
} from "@/lib/db";
import {
  categoryCondition,
  currentOkFacetSet,
} from "@/lib/practice-problems/facet-condition-sql";

import type { ProblemSearch } from "./search";

import { RULE_FLAGS, ruleFlagCondition, type RuleFlag } from "./rule-flags";

/** 一覧の 1 ページの問題数（1 問が盤面と和了の表で縦に長い） */
export const CATEGORY_PROBLEMS_PAGE_SIZE = 10;

/** 種別ごとの、分類・印に当てはまる問題の数 */
export interface CategoryCountRow {
  /** 種別（`practice_problems.kind` の生の値） */
  readonly kind: string;
  /** 分類の ID → 当てはまる問題の数 */
  readonly categories: Readonly<Record<string, number>>;
  /** 印 → その印の立つ和了を持つ問題の数 */
  readonly flags: Readonly<Record<RuleFlag, number>>;
}

function countWhere(condition: SQL) {
  return sql<number>`(count(*) filter (where ${condition}))::int`;
}

/**
 * 種別ごとに、分類とルールで変わる印に当てはまる問題を数える
 * 問題分類件数集計
 *
 * この版で計算できた問題だけが対象。行がある種別だけを返す。
 */
export async function fetchCategoryCounts(): Promise<
  readonly CategoryCountRow[]
> {
  const categoryColumns = Object.fromEntries(
    PROBLEM_CATEGORIES.map((category) => [
      `category:${category.id}`,
      countWhere(categoryCondition(category)),
    ]),
  );
  const flagColumns = Object.fromEntries(
    RULE_FLAGS.map((flag) => [
      `flag:${flag}`,
      countWhere(ruleFlagCondition(flag)),
    ]),
  );
  const rows: readonly Readonly<Record<string, string | number>>[] = await db
    .select({ kind: practiceProblems.kind, ...categoryColumns, ...flagColumns })
    .from(practiceProblemFacetSets)
    .innerJoin(
      practiceProblems,
      eq(practiceProblems.id, practiceProblemFacetSets.problemId),
    )
    .where(currentOkFacetSet())
    .groupBy(practiceProblems.kind);

  const countOf = (row: (typeof rows)[number], key: string) =>
    Number(row[key] ?? 0);
  return rows.map((row) => ({
    kind: String(row.kind),
    categories: Object.fromEntries(
      PROBLEM_CATEGORIES.map((category) => [
        category.id,
        countOf(row, `category:${category.id}`),
      ]),
    ),
    flags: {
      renfonpai: countOf(row, "flag:renfonpai"),
      kiriage: countOf(row, "flag:kiriage"),
      yakumanRules: countOf(row, "flag:yakumanRules"),
    },
  }));
}

/** 一覧の絞り込み。分類・ルールの印・自由検索のいずれかを使う。 */
export type CategoryProblemFilter =
  | { readonly type: "category"; readonly category: ProblemCategory }
  | { readonly type: "flag"; readonly flag: RuleFlag }
  | { readonly type: "search"; readonly search: ProblemSearch };

/** 一覧の 1 問（盤面と、この版の属性） */
export interface CategoryProblem {
  readonly id: string;
  readonly kind: string;
  readonly payload: PracticeProblem["payload"];
  readonly createdAt: Date;
  readonly set: typeof practiceProblemFacetSets.$inferSelect;
  /** 和了ごとの属性（和了牌の順。同じ和了牌はツモが先） */
  readonly rows: readonly (typeof practiceProblemFacets.$inferSelect)[];
}

/** 一覧の 1 ページ */
export interface CategoryProblemsPage {
  readonly problems: readonly CategoryProblem[];
  readonly total: number;
  readonly page: number;
  readonly totalPages: number;
}

/**
 * 分類・印・自由検索に当てはまる問題を、保存の新しい順に 1 ページ読む
 * 問題分類一覧取得
 *
 * 件数・親の行・子の行の 3 クエリ。子は読んだページの問題の分だけを読む。ページ番号は
 * 1 から数え、範囲外は端に寄せる。
 *
 * @param filter - 分類・ルールで変わる印・検証済みの自由検索
 * @param page - URL から来たページ番号
 */
export async function fetchCategoryProblems(
  filter: CategoryProblemFilter,
  page: number,
): Promise<CategoryProblemsPage> {
  const condition = and(
    currentOkFacetSet(),
    filter.type === "category"
      ? categoryCondition(filter.category)
      : filter.type === "flag"
        ? ruleFlagCondition(filter.flag)
        : categoryCondition({
            condition: filter.search.condition,
            tenpaiMatch: "any",
          }),
    filter.type === "search" && filter.search.kind
      ? eq(practiceProblems.kind, filter.search.kind)
      : undefined,
  );
  const [counted] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(practiceProblemFacetSets)
    .innerJoin(
      practiceProblems,
      eq(practiceProblems.id, practiceProblemFacetSets.problemId),
    )
    .where(condition);
  const total = counted?.total ?? 0;
  const totalPages = Math.max(
    1,
    Math.ceil(total / CATEGORY_PROBLEMS_PAGE_SIZE),
  );
  const currentPage = Math.min(Math.max(1, page), totalPages);

  const parents = await db
    .select({ problem: practiceProblems, set: practiceProblemFacetSets })
    .from(practiceProblemFacetSets)
    .innerJoin(
      practiceProblems,
      eq(practiceProblems.id, practiceProblemFacetSets.problemId),
    )
    .where(condition)
    .orderBy(desc(practiceProblems.createdAt), asc(practiceProblems.id))
    .limit(CATEGORY_PROBLEMS_PAGE_SIZE)
    .offset((currentPage - 1) * CATEGORY_PROBLEMS_PAGE_SIZE);

  const children =
    parents.length === 0
      ? []
      : await db
          .select()
          .from(practiceProblemFacets)
          .where(
            and(
              eq(practiceProblemFacets.scoringVersion, SCORING_VERSION),
              inArray(
                practiceProblemFacets.problemId,
                parents.map(({ problem }) => problem.id),
              ),
            ),
          )
          .orderBy(
            asc(practiceProblemFacets.agariHai),
            desc(practiceProblemFacets.isTsumo),
          );

  return {
    problems: parents.map(({ problem, set }) => ({
      id: problem.id,
      kind: problem.kind,
      payload: problem.payload,
      createdAt: problem.createdAt,
      set,
      rows: children.filter((row) => row.problemId === problem.id),
    })),
    total,
    page: currentPage,
    totalPages,
  };
}
