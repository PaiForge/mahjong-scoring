import "server-only";

import { and, eq } from "drizzle-orm";

import { problemReports, type TransactionClient } from "@/lib/db";
import { ProblemReportStatus } from "@/lib/problem-reports/status";

import type { ClosedProblemReportStatus } from "./close-options";

/** 未対応の報告を閉じる内容 */
interface CloseOpenProblemReports {
  /** 閉じる問題（`practice_problems.id`） */
  readonly problemId: string;
  readonly status: ClosedProblemReportStatus;
  /** 管理者のメモ（空なら null） */
  readonly note: string | null;
  /** 閉じた管理者 */
  readonly actorId: string;
  readonly now: Date;
}

/**
 * 同じ問題への未対応の報告を、すべて同じ状態・同じメモで閉じる
 * 問題報告の一括クローズ
 *
 * 誤りは問題（盤面）にあり、報告した人が別々でも見る物は同じなので、1 件ずつ
 * 閉じさせない。閉じた報告は書き換えない（先に閉じたものの状態・メモ・閉じた人を残す）。
 *
 * @returns 閉じた報告の id（監査ログに残す）
 */
export async function closeOpenProblemReports(
  tx: TransactionClient,
  { problemId, status, note, actorId, now }: CloseOpenProblemReports,
): Promise<string[]> {
  const closed = await tx
    .update(problemReports)
    .set({
      status,
      resolutionNote: note,
      resolvedBy: actorId,
      resolvedAt: now,
    })
    .where(
      and(
        eq(problemReports.problemId, problemId),
        eq(problemReports.status, ProblemReportStatus.Open),
      ),
    )
    .returning({ id: problemReports.id });
  return closed.map((row) => row.id);
}
