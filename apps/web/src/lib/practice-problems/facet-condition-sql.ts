/**
 * 分類の条件から、属性の表に対する SQL の絞り込みを導く
 * 属性条件SQL
 *
 * @description
 * 分類（features の `problem-facets/categories.ts`）は属性に対する構造化した条件で、
 * 同じ条件から「組み立てた属性に対する判定」（`problemMatchesCategory`）と、ここの SQL の
 * 両方を導く。2 つが同じ問題を選ぶことは統合テスト
 * （`facet-condition-sql.integration.test.ts`）が全項目で突き合わせる。条件の項目を
 * 足したら両方に足す。
 *
 * @design 問題を数える条件は EXISTS で書く
 * 属性は和了 1 つで 1 行（聴牌形は待ち × ツモ/ロン）なので、親と子を結合して数えると
 * 和了の数だけ問題が増える。親の行 1 つにつき「条件を満たす子があるか」を EXISTS で
 * 見て、問題・解答を水増ししない。
 *
 * @design 読むのは自分のコードの採点の版の行だけ
 * 親の行を `scoring_version = SCORING_VERSION` と `status = 'ok'` で絞るのは呼び出し側
 * （{@link currentOkFacetSet}）。子は親の主キー（問題 × 版）で相関させるので、別の版の
 * 子が混ざらない。
 */
import "server-only";

import { SCORING_VERSION } from "@mahjong-scoring/core";
import type {
  FacetCondition,
  ProblemCategory,
} from "@mahjong-scoring/features/problem-facets/categories";
import { and, eq, sql, type SQL } from "drizzle-orm";

import { practiceProblemFacetSets, practiceProblemFacets } from "../db";

const sets = practiceProblemFacetSets;
const facets = practiceProblemFacets;

/** 文字列の列を `ARRAY[$1, $2, ...]::text[]` にする（値はバインド変数） */
function textArray(values: readonly string[]): SQL {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

/** 文字列の列を `($1, $2, ...)` にする（値はバインド変数） */
function textList(values: readonly string[]): SQL {
  return sql`(${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )})`;
}

/**
 * この版で計算でき、属性の行がある親の行、という条件
 * 現行版の計算済み条件
 *
 * 分類の件数・一覧のクエリは、`practice_problem_facet_sets` をこの条件で絞ってから
 * {@link categoryCondition} を当てる。
 */
export function currentOkFacetSet(): SQL {
  return sql`${sets.scoringVersion} = ${SCORING_VERSION} AND ${sets.status} = 'ok'`;
}

/**
 * 親の行の和了（子の行）のうち、条件を満たすものがあるか、という EXISTS
 * 和了存在条件
 *
 * @param rowCondition - 子の行（と、相関した親の行）に対する条件
 */
export function existsFacetRow(rowCondition: SQL): SQL {
  return sql`EXISTS (SELECT 1 FROM ${facets} WHERE ${and(
    eq(facets.problemId, sets.problemId),
    eq(facets.scoringVersion, sets.scoringVersion),
    rowCondition,
  )})`;
}

/**
 * 和了 1 つ（子の行）が条件を満たす、という SQL
 * 属性条件SQL化
 *
 * features の `facetRowMatches` と同じ意味。役が無くロンできない和了（`noYaku`）は
 * どの条件も満たさないので、`result = 'scored'` を必ず付ける。門前かどうかは親の列
 * なので、親の行と相関した文脈（{@link existsFacetRow} の中）で使う。
 *
 * @param condition - 分類の条件（指定した項目を AND で結ぶ）
 */
export function facetConditionSql(condition: FacetCondition): SQL {
  const { yakuAll, yakuAny, fuEq, fuMin, machiIn, scoreLevelIn } = condition;
  const parts: SQL[] = [sql`${facets.result} = 'scored'`];
  if (yakuAll) parts.push(sql`${facets.yaku} @> ${textArray(yakuAll)}`);
  if (yakuAny) parts.push(sql`${facets.yaku} && ${textArray(yakuAny)}`);
  if (fuEq !== undefined) parts.push(sql`${facets.fu} = ${fuEq}`);
  if (fuMin !== undefined) parts.push(sql`${facets.fu} >= ${fuMin}`);
  if (machiIn) parts.push(sql`${facets.machi} IN ${textList(machiIn)}`);
  if (condition.isTsumo !== undefined) {
    parts.push(sql`${facets.isTsumo} = ${condition.isTsumo}`);
  }
  if (condition.isMenzen !== undefined) {
    parts.push(sql`${sets.isMenzen} = ${condition.isMenzen}`);
  }
  if (scoreLevelIn) {
    parts.push(sql`${facets.scoreLevel} IN ${textList(scoreLevelIn)}`);
  }
  return sql.join(parts, sql` AND `);
}

/**
 * 親の行 1 つ（= 問題 1 つ）が分類に入る、という SQL
 * 問題分類SQL化
 *
 * features の `problemMatchesCategory` と同じ意味。
 * - `any`: 条件を満たす和了が 1 つでもある
 * - `all`: 和了があり、条件を満たさない和了が 1 つも無い。「満たさない」は
 *   `IS NOT TRUE` で見る — 待ちの形を持たない和了（`machi` が NULL）への `IN` は
 *   NULL になり、`NOT` だけでは「満たさない」に数えられない
 *
 * @param category - 分類（条件と、聴牌形に当てるときの意味）
 */
export function categoryCondition(
  category: Pick<ProblemCategory, "condition" | "tenpaiMatch">,
): SQL {
  const row = facetConditionSql(category.condition);
  if (category.tenpaiMatch === "any") return existsFacetRow(row);
  return sql`(${existsFacetRow(sql`TRUE`)} AND NOT ${existsFacetRow(
    sql`(${row}) IS NOT TRUE`,
  )})`;
}
