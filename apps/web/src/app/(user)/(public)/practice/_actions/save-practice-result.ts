"use server";
import { authenticateAndCheckBan } from "@/lib/auth";
import { finishAttempt } from "@/lib/challenge/attempts";
import { logExternalError } from "@/lib/log-error";

/** サーバーで確定した結果の応答。 */
export type SaveResultResponse =
  | { readonly success: true; readonly challengeResultId: string }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

/** 挑戦IDだけを受け取り、サーバーで採点済みの結果を一度だけ確定する。 */
export async function savePracticeResult(
  attemptId: string,
): Promise<SaveResultResponse> {
  try {
    const auth = await authenticateAndCheckBan();
    if ("error" in auth)
      return auth.error === "unauthorized"
        ? { success: true, skipped: "anonymous" }
        : { success: false, error: auth.error };
    const result = await finishAttempt(auth.user.id, attemptId, false);
    if (!result || !("challengeResultId" in result))
      return { success: false, error: "invalid_result" };
    return { success: true, challengeResultId: result.challengeResultId };
  } catch (error) {
    logExternalError("savePracticeResult", "finish failed", error);
    return { success: false, error: "unexpected_error" };
  }
}
