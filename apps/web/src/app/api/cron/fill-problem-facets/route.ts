import type { NextResponse } from "next/server";

import { runCronJob } from "@/lib/cron-job";
import {
  countProblemFacetCoverage,
  fillMissingProblemFacets,
} from "@/lib/practice-problems/facets";

/**
 * 保存問題の属性の不足分を埋める日次バッチの受け口
 * 問題属性補充Cron
 *
 * @description
 * 保存問題のうち、このデプロイの採点の版の属性の行を持たないものを計算して書く
 * （処理の中身と、埋める経路をここ・保存の入口・管理画面の 3 つにした理由は
 * `lib/practice-problems/facets.ts`）。`vercel.json` の `crons` が 1 日 1 回呼ぶ。
 * 手で叩くときも同じヘッダを付ける:
 *
 * ```
 * curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/fill-problem-facets
 * ```
 *
 * 1 回に計算するのは時間の上限（`PROBLEM_FACET_FILL_BUDGET_MS`）までで、残りは翌日の実行か
 * 管理画面の手動の実行が続きから埋める。何度呼んでも同じ問題の行は増えない。
 * 応答とログには、書いた行の内訳と、実行後にまだ未計算の問題の数（`missing`）を出す。
 * 採点の版を上げた直後は `missing` が保存問題の全数から減っていく。
 */
export function GET(request: Request): Promise<NextResponse> {
  return runCronJob(request, {
    tag: "cron/fill-problem-facets",
    failureMessage: "failed to fill problem facets",
    run: async () => {
      const filled = await fillMissingProblemFacets();
      const coverage = await countProblemFacetCoverage();
      const missing = coverage.reduce((sum, row) => sum + row.missing, 0);
      return { ...filled, missing };
    },
    summarize: (result) =>
      `computed=${result.computed} failed=${result.failed} skipped=${result.skipped} errored=${result.errored} missing=${result.missing} elapsedMs=${result.elapsedMs}`,
  });
}
