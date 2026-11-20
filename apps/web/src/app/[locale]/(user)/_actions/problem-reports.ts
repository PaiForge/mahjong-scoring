"use server";

import type { ActionResult } from "@/lib/action-types";
import { guardUserAction } from "@/lib/action-guard";
import type { UserActionGuardErrorCode } from "@/lib/action-guard";
import { extractPgErrorCode } from "@/lib/db/extract-pg-error-code";
import { logExternalError } from "@/lib/log-error";
import {
  createProblemReport,
  PROBLEM_REPORT_BODY_MAX_BYTES,
} from "@/lib/problem-reports/create-problem-report";
import { enforceUserRateLimit } from "@/lib/rate-limit-ip";
import {
  validateProblemReportInput,
  type ProblemReportInputError,
  type ProblemReportRequest,
} from "@mahjong-scoring/features/problem-reports/problem-report";

/**
 * 問題の報告の失敗理由
 *
 * - `invalidRequest` — 盤面・画面・段階・ルール設定・理由の組み合わせが検証を通らない、
 *   または本文が大きすぎる（画面の操作では起こらない）
 * - `dailyLimit` — 直近 24 時間の報告がアカウントの上限に達している
 * - `failed` — DB の失敗など（送り直してよい）
 */
export type ReportProblemError =
  | UserActionGuardErrorCode
  | ProblemReportInputError
  | "invalidRequest"
  | "dailyLimit"
  | "failed";

/** 本文を JSON にした UTF-8 のバイト数。JSON にできない値は null */
function jsonByteLength(value: unknown): number | null {
  try {
    const json = JSON.stringify(value);
    return json === undefined ? null : new TextEncoder().encode(json).length;
  } catch {
    return null;
  }
}

/**
 * 出題した問題の誤りを運営へ報告する Server Action
 * 問題報告
 *
 * 和了形・聴牌形の点数計算と本日の問題の画面の「問題を報告」から呼ぶ。順序は
 * IP の枠と認証・BAN のゲート（`guardUserAction`）→ アカウントの枠 →
 * 本文の大きさ → 理由・詳細の検証 → 受付（`createProblemReport`）。
 * 受け付けると、その問題に他の未対応の報告が無ければ運営者にメールが届く。
 *
 * @design 報告できるのはログイン済みの利用者だけ
 * 匿名の書き込み口を作らない（スパム対策の中心）。BAN 中・退会処理中は認証の
 * ゲートが弾く。出題した問題の保存（`practice_problems`）も匿名の出題は保存しない。
 * 匿名も受け付ける案は、CAPTCHA 等の新しい仕組みが要るので採らない。
 *
 * @design 入口は Server Action、本体は `lib/problem-reports/create-problem-report.ts`
 * 利用者の通報（`reportUserAction` → `createReport`）と同じ形。報告はモーダルを
 * 開いた人が待つ操作で、出題の保存のように Server Action の列を詰まらせる心配が
 * 小さい。アプリの入口を足すときは、本体を Route Handler から呼ぶ。
 *
 * 引数は信頼しない（型は TS の上のものでしかなく、クライアントは任意の値を送れる）。
 * 失敗の記録には PostgreSQL のエラーコードだけを残す（例外のメッセージは盤面・
 * 詳細を SQL のパラメータとして含む）。
 *
 * @param request - 報告の本文（盤面・画面・段階・ルール設定・理由・詳細）
 */
export async function reportProblemAction(
  request: ProblemReportRequest,
): Promise<ActionResult<ReportProblemError>> {
  const guard = await guardUserAction("reportProblem");
  if ("error" in guard) return guard;
  const rateLimited = enforceUserRateLimit(guard.user.id, "reportProblem");
  if (rateLimited) return rateLimited;

  const size = jsonByteLength(request);
  if (
    typeof request !== "object" ||
    request === null ||
    size === null ||
    size > PROBLEM_REPORT_BODY_MAX_BYTES
  ) {
    return { error: "invalidRequest" };
  }
  const input = validateProblemReportInput(request.reason, request.detail);
  if (!input.ok) return { error: input.error };

  try {
    const result = await createProblemReport(guard.user.id, request, "web");
    if (result === "accountClosing") return { error: "unauthorized" };
    if (result !== "done") return { error: result };
  } catch (error) {
    logExternalError(
      "reportProblemAction",
      "failed to report a problem",
      extractPgErrorCode(error) ?? "unknown",
    );
    return { error: "failed" };
  }
  return { success: true };
}
