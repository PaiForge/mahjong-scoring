/**
 * 保存問題の属性の書き込み（不足している問題だけを計算する）
 * 問題属性の補充
 *
 * @description
 * 保存問題（`practice_problems`）のうち、このコードの採点の版（`SCORING_VERSION`）の
 * 属性の行をまだ持たないものを計算し、`practice_problem_facet_sets`（問題 × 版で 1 行）と
 * `practice_problem_facets`（和了 1 つで 1 行）に書く。計算そのものは features の純粋な
 * 関数（`problem-facets/compute.ts`）で、ここは「どの問題を計算するか」と書き込みだけを持つ。
 *
 * @design 埋める経路は 3 つで、どれもこの 1 つの冪等な処理を呼ぶ
 * - 保存の入口（`archive.ts`）: 新しく入った 1 問をその場で計算する
 * - 日次の cron（`/api/cron/fill-problem-facets`）: 入口で取りこぼした問題と、採点の版を
 *   上げた後の全問題を少しずつ埋める
 * - 管理画面からの手動の実行（`/admin/problem-categories`）: 分類を見る前に不足分を埋める
 *
 * デプロイ前の処理（prebuild）には載せない。公開前に埋めても、その後に古いデプロイが
 * 保存した問題は新しい版の行を持たず、網羅は保証できない。ビルドの時間も行数に比例して延びる。
 *
 * @design 版が不完全な時間があることを許し、読む側は件数を併記する
 * 採点の版を上げた直後は、新しい版の行がまだ無い問題が残る。未計算の問題は分類の
 * 対象外として扱い、分類を出す画面と集計は「計算済み n 件 / 全 m 件」を一緒に出す
 * （{@link countProblemFacetCoverage}）。網羅が要る処理は、対象の問題の集合を固定し、
 * 読む前に不足分を埋める。読む側は自分のコードの `SCORING_VERSION` の行だけを読む —
 * 古い版・新しい版（ロールバック先・切り替え中の別のデプロイ）の行が同じ表に並ぶため。
 *
 * @design 世代を管理する表は作らず、古い版の行は自動で消さない
 * 「どの版が完成したか」を持つ表を作らないのは、保存の入口が常に問題を足し続けるので
 * 「完成」が一時的な状態でしかないため。不足は行の有無から都度数える。古い版の行の
 * 削除は、稼働中の版とロールバック先の版を確かめたうえで版を指定して手で行う
 * （自動で消すと、ロールバックした瞬間に属性が全部未計算になる）。
 *
 * @design 親の ok の行と子の行は 1 つのトランザクションで書く
 * 親だけ・子だけが見える時間を作らない（分類の件数は親の `ok` を計算済みと数え、
 * 子の行で絞り込むので、親だけが見えると「計算済みなのにどの分類にも入らない」問題に
 * 見える）。親は `ON CONFLICT DO NOTHING` で入れ、入らなかった（別の経路が先に書いた）
 * ときは子を書かない。行は書いた後に書き換えない。
 *
 * @design インデックスは足していない（既知のトレードオフ）
 * 不足の検索は `practice_problems` の全表走査 + 親の主キーの照合になる。行数とクエリを
 * 測ってから足す。
 */
import "server-only";

import { SCORING_VERSION } from "@mahjong-scoring/core";
import {
  computeProblemFacets,
  type ProblemFacets,
} from "@mahjong-scoring/features/problem-facets/compute";
import { and, asc, eq, inArray, notExists, sql } from "drizzle-orm";

import {
  db,
  practiceProblemFacetSets,
  practiceProblemFacets,
  practiceProblems,
} from "../db";
import { extractPgErrorCode } from "../db/extract-pg-error-code";
import { logExternalError } from "../log-error";

/**
 * 1 回の実行で計算する問題数の上限（cron・手動の実行の既定）
 *
 * 1 問は標準ルールを含む 6 通りの組み立てと 1 トランザクション（親 1 行 + 子の行）。
 * 上限を超えた分は未計算のまま残り、次の実行が続きから埋める（読む側が件数を併記する
 * ので、残っていても誤読しない）。関数の実行時間の上限に収めるための値で、厳密な
 * 根拠は無い — 所要時間は実行ごとの結果（`elapsedMs`）で見て調整する。
 */
export const PROBLEM_FACET_FILL_LIMIT = 500;

/** {@link fillMissingProblemFacets} の指定 */
export interface FillProblemFacetsOptions {
  /** 計算する問題数の上限（既定 {@link PROBLEM_FACET_FILL_LIMIT}） */
  readonly limit?: number;
  /** 対象をこの問題に限る（保存の入口が、入れた 1 問だけを計算するのに使う） */
  readonly problemIds?: readonly string[];
}

/**
 * 補充 1 回の結果
 * 問題属性補充結果
 */
export interface FillProblemFacetsResult {
  /** 計算して `ok` の行を書いた問題の数 */
  readonly computed: number;
  /** 標準ルールで組み立てられず `failed` の行を書いた問題の数 */
  readonly failed: number;
  /** 別の経路が先に書いていて、何も書かなかった問題の数 */
  readonly skipped: number;
  /** 計算か書き込みが例外で落ち、未計算のまま残した問題の数（ログに残す） */
  readonly errored: number;
  /** 掛かった時間（ミリ秒） */
  readonly elapsedMs: number;
}

/** この版の属性の行をまだ持たない問題、という条件 */
function missingFacetSet() {
  return notExists(
    db
      .select({ one: sql`1` })
      .from(practiceProblemFacetSets)
      .where(
        and(
          eq(practiceProblemFacetSets.problemId, practiceProblems.id),
          eq(practiceProblemFacetSets.scoringVersion, SCORING_VERSION),
        ),
      ),
  );
}

/**
 * 計算した属性を 1 トランザクションで書く
 *
 * @returns 書いたら true。別の経路が先に書いていたら false（何も書かない）
 */
async function writeProblemFacets(
  problemId: string,
  facets: ProblemFacets,
): Promise<boolean> {
  const key = { problemId, scoringVersion: SCORING_VERSION };
  return db.transaction(async (tx) => {
    const { set } = facets;
    const inserted = await tx
      .insert(practiceProblemFacetSets)
      .values({
        ...key,
        ...set,
        revision: process.env.VERCEL_GIT_COMMIT_SHA || null,
      })
      .onConflictDoNothing()
      .returning({ problemId: practiceProblemFacetSets.problemId });
    if (inserted.length === 0) return false;
    if (facets.rows.length > 0) {
      await tx.insert(practiceProblemFacets).values(
        facets.rows.map((row) =>
          row.result === "scored"
            ? // 役の配列は読み取り専用の型なので、列の型（可変の配列）へ写す
              { ...key, ...row, yaku: [...row.yaku] }
            : { ...key, ...row },
        ),
      );
    }
    return true;
  });
}

/**
 * 属性の行が不足している問題を計算して書く
 * 問題属性補充
 *
 * @description
 * この版（`SCORING_VERSION`）の親の行を持たない問題を、保存の古い順に上限まで読み、
 * 1 問ずつ計算して書く。何度呼んでも、並行して呼んでも、同じ問題の行は 1 組だけになる
 * （親の主キーと `ON CONFLICT DO NOTHING`）。上限を超えた分は残す。
 *
 * 1 問の計算か書き込みが例外で落ちても、その問題を未計算のまま残して次へ進む
 * （1 問の不具合で残り全部が止まらないようにする）。ログには問題の ID と PostgreSQL の
 * エラーコードだけを出し、例外の中身（盤面の JSON を含みうる）は出さない。
 *
 * @param options - 上限と、対象を限る問題の ID
 * @returns 書いた行の内訳と所要時間
 * @throws 不足している問題の読み取りが失敗したとき
 */
export async function fillMissingProblemFacets({
  limit = PROBLEM_FACET_FILL_LIMIT,
  problemIds,
}: FillProblemFacetsOptions = {}): Promise<FillProblemFacetsResult> {
  const startedAt = Date.now();
  const result = { computed: 0, failed: 0, skipped: 0, errored: 0 };
  if (problemIds?.length === 0) return { ...result, elapsedMs: 0 };

  const problems = await db
    .select({
      id: practiceProblems.id,
      kind: practiceProblems.kind,
      schemaVersion: practiceProblems.schemaVersion,
      payload: practiceProblems.payload,
    })
    .from(practiceProblems)
    .where(
      and(
        missingFacetSet(),
        problemIds ? inArray(practiceProblems.id, [...problemIds]) : undefined,
      ),
    )
    .orderBy(asc(practiceProblems.createdAt), asc(practiceProblems.id))
    .limit(limit);

  for (const problem of problems) {
    try {
      const facets = computeProblemFacets(problem);
      const written = await writeProblemFacets(problem.id, facets);
      if (!written) result.skipped += 1;
      else if (facets.set.status === "ok") result.computed += 1;
      else result.failed += 1;
    } catch (error) {
      result.errored += 1;
      logExternalError(
        "fillMissingProblemFacets",
        `問題の属性を書けなかった: ${problem.id}`,
        extractPgErrorCode(error) ?? "unknown",
      );
    }
  }
  return { ...result, elapsedMs: Date.now() - startedAt };
}

/**
 * 属性の網羅の状況（この版の行を数える）
 * 問題属性網羅状況
 *
 * 「計算済み」をひとまとめにせず、成功・失敗・未計算を分ける。失敗は計算を試みた
 * 結果で、もう一度計算しても同じ結果になる（未計算とは違い、埋める対象ではない）。
 */
export interface ProblemFacetCoverage {
  /** 種別（`practice_problems.kind` の生の値） */
  readonly kind: string;
  /** 保存問題の数 */
  readonly total: number;
  /** この版で計算でき、属性の行がある */
  readonly ok: number;
  /** この版では標準ルールで組み立てられない */
  readonly failed: number;
  /** この版の行がまだ無い */
  readonly missing: number;
}

/**
 * 種別ごとの属性の網羅の状況を数える
 * 問題属性網羅集計
 *
 * `practice_problems` にこの版の親の行を左外部結合し、`GROUP BY kind` で数える。
 * 行がある種別だけを返す。
 */
export async function countProblemFacetCoverage(): Promise<
  readonly ProblemFacetCoverage[]
> {
  const status = practiceProblemFacetSets.status;
  const rows = await db
    .select({
      kind: practiceProblems.kind,
      total: sql<number>`count(*)::int`,
      ok: sql<number>`(count(*) filter (where ${status} = 'ok'))::int`,
      failed: sql<number>`(count(*) filter (where ${status} = 'failed'))::int`,
      missing: sql<number>`(count(*) filter (where ${status} is null))::int`,
    })
    .from(practiceProblems)
    .leftJoin(
      practiceProblemFacetSets,
      and(
        eq(practiceProblemFacetSets.problemId, practiceProblems.id),
        eq(practiceProblemFacetSets.scoringVersion, SCORING_VERSION),
      ),
    )
    .groupBy(practiceProblems.kind);
  return rows.map((row) => ({
    kind: row.kind,
    total: row.total,
    ok: row.ok,
    failed: row.failed,
    missing: row.missing,
  }));
}
