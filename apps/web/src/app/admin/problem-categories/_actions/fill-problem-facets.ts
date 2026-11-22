"use server";

import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { logExternalError } from "@/lib/log-error";
import {
  countProblemFacetCoverage,
  fillMissingProblemFacets,
} from "@/lib/practice-problems/facets";

import { requireAdminActor } from "../../_lib/auth";

/** 手動の実行 1 回の結果（画面に出す数だけ） */
export interface FillProblemFacetsSummary {
  /** 計算して属性の行を書いた問題の数 */
  readonly computed: number;
  /** 標準ルールで組み立てられず、失敗として記録した問題の数 */
  readonly failed: number;
  /** 例外で落ち、未計算のまま残した問題の数 */
  readonly errored: number;
  /** 実行後にまだ未計算の問題の数 */
  readonly missing: number;
}

/**
 * 保存問題の属性の不足分を、管理画面から手動で埋める
 * 問題属性補充（手動）
 *
 * 日次の cron と同じ処理（`fillMissingProblemFacets`）を 1 回走らせ、実行後の未計算の
 * 数を返す。1 回に計算できるのは時間の上限までなので、未計算が残っていれば画面から
 * 続けて押す。採点の版を上げた直後や、分類を見る前に不足分を埋めたいときに使う。
 *
 * 監査ログには残さない。属性は盤面から導ける派生値で、何度実行しても同じ行になり、
 * 利用者に見えるものも管理者が決めた内容も変えない（監査ログは管理者の判断を伴う操作の記録）。
 */
export async function fillProblemFacets(): Promise<
  ActionResult<"unauthorized" | "failed", { summary: FillProblemFacetsSummary }>
> {
  const actor = await requireAdminActor("unauthorized");
  if ("error" in actor) return actor;
  try {
    const { computed, failed, errored } = await fillMissingProblemFacets();
    const coverage = await countProblemFacetCoverage();
    const missing = coverage.reduce((sum, row) => sum + row.missing, 0);
    revalidatePath("/admin/problem-categories");
    return { success: true, summary: { computed, failed, errored, missing } };
  } catch (error) {
    logExternalError("fillProblemFacets", "問題の属性の補充に失敗", error);
    return { error: "failed" };
  }
}
