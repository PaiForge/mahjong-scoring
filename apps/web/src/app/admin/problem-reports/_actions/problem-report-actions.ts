"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-types";
import { db, moderationActions, problemReports } from "@/lib/db";
import { logExternalError } from "@/lib/log-error";
import { ProblemReportStatus } from "@/lib/problem-reports/status";

import { requireAdminActor } from "../../_lib/auth";
import {
  CLOSED_PROBLEM_REPORT_STATUSES,
  PROBLEM_REPORT_RESOLUTION_NOTE_MAX_LENGTH,
  type ClosedProblemReportStatus,
} from "../_lib/close-options";
import { closeOpenProblemReports } from "../_lib/close-problem-reports";

/** 問題の報告を閉じる操作の失敗理由 */
export type CloseProblemReportError =
  "unauthorized" | "invalidInput" | "notFound" | "failed";

/**
 * 監査ログ（`moderation_actions`）に残す操作の種類と対象の種別
 *
 * 対象は報告ではなく問題（`target_key` = `practice_problems.id`）。まとめて閉じた
 * 報告の id・状態・メモは metadata に入れる（`reason` 列は利用者への操作の理由で、
 * 利用者以外への操作は `recordContentAction` と同じく metadata に持つ）。
 */
const AUDIT_ACTION = "close_problem_report";
const AUDIT_TARGET_TYPE = "practice_problem";

const inputSchema = z.object({
  id: z.uuid(),
  status: z.enum(CLOSED_PROBLEM_REPORT_STATUSES),
  note: z.string().trim().max(PROBLEM_REPORT_RESOLUTION_NOTE_MAX_LENGTH),
});

/**
 * 問題の報告を「修正済み」「問題なし」で閉じる（管理者だけ）
 * 問題報告クローズ
 *
 * 管理者は詳細ページで、報告時の正解（`problem_reports.snapshot`）と今の採点で
 * 組み立て直した正解を見比べてから押す。直したかどうかは、この 2 つが食い違うか
 * （採点を直した後に正解が変わったか）で読める。`resolved` は「修正済み」
 * （正解・盤面の誤りを直した、または直すと決めた）、`dismissed` は「問題なし」
 * （正解は正しかった等）。メモは任意。
 *
 * 押した 1 件だけでなく、同じ問題（`problem_id`）への未対応の報告をまとめて
 * 同じ状態・同じメモで閉じる。誤りは問題にあり、報告した人が別々でも見るものは
 * 同じなので、1 件ずつ閉じさせない（利用者の通報の BAN が「その人」への未対応を
 * まとめて閉じるのと同じ考え）。すでに閉じた報告は書き換えない。
 *
 * 押した報告が未対応でなければ `notFound`（別の管理者が先に閉じた等）。報告の行を
 * ロックしてから閉じ、同じ問題を 2 人が同時に閉じても監査ログが二重にならないようにする。
 * 閉じる更新と監査ログは同じトランザクションで書き、ログが書けなければ閉じない。
 *
 * @param id - 押した報告の id
 * @param status - 閉じる状態（`resolved` / `dismissed`。クライアントから届くので実行時にも確かめる）
 * @param note - 管理者のメモ（空でよい。前後の空白は落とす）
 */
export async function closeProblemReportAction(
  id: string,
  status: ClosedProblemReportStatus,
  note: string,
): Promise<ActionResult<CloseProblemReportError>> {
  const actor = await requireAdminActor("unauthorized");
  if ("error" in actor) return actor;
  const parsed = inputSchema.safeParse({ id, status, note });
  if (!parsed.success) return { error: "invalidInput" };
  const input = parsed.data;
  const resolutionNote = input.note === "" ? null : input.note;

  try {
    const closed = await db.transaction(async (tx) => {
      const [report] = await tx
        .select({ problemId: problemReports.problemId })
        .from(problemReports)
        .where(
          and(
            eq(problemReports.id, input.id),
            eq(problemReports.status, ProblemReportStatus.Open),
          ),
        )
        .for("update");
      if (!report) return false;
      const reportIds = await closeOpenProblemReports(tx, {
        problemId: report.problemId,
        status: input.status,
        note: resolutionNote,
        actorId: actor.actorId,
        now: new Date(),
      });
      await tx.insert(moderationActions).values({
        actorId: actor.actorId,
        action: AUDIT_ACTION,
        targetType: AUDIT_TARGET_TYPE,
        targetKey: report.problemId,
        ipAddress: actor.ipAddress,
        metadata: {
          reportId: input.id,
          reportIds,
          status: input.status,
          note: resolutionNote,
        },
      });
      return true;
    });
    if (!closed) return { error: "notFound" };
  } catch (error) {
    logExternalError(
      "closeProblemReport",
      "問題の報告を閉じられなかった",
      error,
    );
    return { error: "failed" };
  }
  revalidatePath("/admin/problem-reports", "layout");
  return { success: true };
}
