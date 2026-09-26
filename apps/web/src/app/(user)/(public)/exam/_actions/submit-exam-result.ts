"use server";
import { authenticateAndCheckBan } from "@/lib/auth";
import { finishAttempt } from "@/lib/challenge/attempts";
import { logExternalError } from "@/lib/log-error";
import type { RankSlug } from "@/lib/ranks/registry";

/** サーバーで確定した結果の応答。 */
export type SubmitExamResponse =
  | { readonly success: true; readonly grantedRanks: readonly RankSlug[] }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

/** 挑戦IDだけを受け取り、サーバーで採点済みの結果を一度だけ確定する。 */
export async function submitExamResult(
  attemptId: string,
): Promise<SubmitExamResponse> {
  try {
    const auth = await authenticateAndCheckBan();
    if ("error" in auth)
      return auth.error === "unauthorized"
        ? { success: true, skipped: "anonymous" }
        : { success: false, error: auth.error };
    const result = await finishAttempt(auth.user.id, attemptId, true);
    if (!result || !("grantedRanks" in result))
      return { success: false, error: "invalid_result" };
    return { success: true, grantedRanks: result.grantedRanks };
  } catch (error) {
    logExternalError("submitExamResult", "finish failed", error);
    return { success: false, error: "unexpected_error" };
  }
}
