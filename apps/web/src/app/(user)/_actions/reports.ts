"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { logExternalError } from "@/lib/log-error";
import { createReport } from "@/lib/reports/create-report";
import {
  validateReportInput,
  type ReportInputError,
} from "@mahjong-scoring/features/reports/report";

/** 通報の失敗理由 */
export type ReportUserError =
  UserActionGuardErrorCode | ReportInputError | "notFound" | "self" | "failed";

/**
 * 相手を通報する Server Action
 * 通報
 *
 * 公開プロフィールの通報フォームから呼ぶ。受け付けると運営者にメールが届く
 * （`lib/reports/create-report.ts`）。
 */
export async function reportUserAction(
  username: string,
  reason: string,
  detail: string,
): Promise<ActionResult<ReportUserError>> {
  const guard = await guardUserAction("reportUser");
  if ("error" in guard) return guard;
  const input = validateReportInput(reason, detail);
  if (!input.ok) return { error: input.error };
  try {
    const result = await createReport(guard.user.id, username, input.value);
    if (result === "accountClosing") return { error: "unauthorized" };
    if (result !== "done") return { error: result };
  } catch (error) {
    logExternalError("reportUserAction", "failed to report", error);
    return { error: "failed" };
  }
  return { success: true };
}
