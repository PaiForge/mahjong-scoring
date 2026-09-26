"use server";
import { authenticateAndCheckBan } from "@/lib/auth";
import { finishAttempt } from "@/lib/challenge/attempts";
import { logExternalError } from "@/lib/log-error";
import type { RankSlug } from "@/lib/ranks/registry";

/**
 * `submitExamResult` の戻り値
 * 試験結果送信レスポンス
 *
 * - `{ success: true, grantedRanks }`: 採点済み。`grantedRanks` は今回の走行を
 *   機に新たに付与された段級位（0 件または 1 件）。不合格・再挑戦・既に
 *   保持している級の試験では空配列。
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表す（未ログインでは挑戦が始まらない
 *   ため、通常は起きない）。
 * - `{ success: false, error: 'banned' }`: BAN されたユーザー。採点しない。
 * - `{ success: false, error: 'invalid_result' }`: 採点できる試験の挑戦ではない。
 *   存在しない・他人の・確定済みの挑戦、試験でない練習の挑戦、まだ終わって
 *   いない挑戦（時間切れにもミス上限にも達していない）。
 * - `{ success: false, error: 'unexpected_error' }`: DB エラー等。挑戦の確定も
 *   ロールバックされるため、同じ挑戦 ID で再送できる。
 */
export type SubmitExamResponse =
  | { readonly success: true; readonly grantedRanks: readonly RankSlug[] }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

/**
 * サーバーで採点済みの試験の挑戦を確定し、合格なら段級位を付与する Server Action
 * 試験結果送信
 *
 * @description
 * 試験の走行は記録しない。`challenge_results` / `challenge_best_scores` には
 * 書かず、ランキング・マイレコード・EXP のどれにも載らない。成果は段級位
 * （`user_ranks`）だけで表す。記録を残さないのは、試験が「同じ問題を繰り返して
 * 数字を伸ばす」類のものではなく、合否の判定だけが目的だから。
 *
 * 受け取るのは挑戦 ID だけで、正解数と試験の種別は `challenge_attempts` に
 * 保管したサーバー側の状態から取る。以前はクライアントが採点した正解数を
 * 受け取っていたため、Action を直接呼べば合格点を申告できた。挑戦の消費と
 * 段級位の付与は同じトランザクションで行い、同じ挑戦で二度付与しない。
 *
 * 受験資格（次に取る級の試験か、達成済みの級の再挑戦）は挑戦の開始時
 * （`beginAttempt`）に検査し、資格のない試験は挑戦自体が作られない。飛び級の
 * 禁止はページ側のガードだけでなくサーバーでも強制する。付与の判定
 * （`gradeExamRun`）自体も「次の級の試験でなければ付与しない」ので、
 * 資格ガードは二重の安全装置。
 *
 * @param attemptId - `beginChallenge` が発行した挑戦 ID
 */
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
