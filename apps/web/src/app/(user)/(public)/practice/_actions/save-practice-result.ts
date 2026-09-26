"use server";
import { authenticateAndCheckBan } from "@/lib/auth";
import { finishAttempt } from "@/lib/challenge/attempts";
import { logExternalError } from "@/lib/log-error";

/**
 * `savePracticeResult` の戻り値
 * 練習結果保存レスポンス
 *
 * - `{ success: true, challengeResultId }`: 認証済みユーザーの保存成功。
 * - `{ success: true, skipped: 'anonymous' }`: 未ログインユーザーによる呼び出し。
 *   エラーではなく「期待された no-op」を表す。呼び出し側は静かに無視すること。
 * - `{ success: false, error: 'banned' }`: BAN されたユーザー。記録しない。
 * - `{ success: false, error: 'invalid_result' }`: 記録できる挑戦ではない。
 *   存在しない・他人の・確定済みの挑戦、昇級試験の挑戦、まだ終わっていない
 *   挑戦（時間切れにもミス上限にも達していない）、1 問も回答していない挑戦。
 * - `{ success: false, error: 'unexpected_error' }`: DB エラー等。挑戦の確定も
 *   ロールバックされるため、同じ挑戦 ID で再送できる。
 */
export type SaveResultResponse =
  | { readonly success: true; readonly challengeResultId: string }
  | { readonly success: true; readonly skipped: "anonymous" }
  | { readonly success: false; readonly error: string };

/**
 * サーバーで採点済みの挑戦を確定し、challenge_results / challenge_best_scores に
 * 保存する Server Action
 * 練習結果保存
 *
 * @description
 * 受け取るのは挑戦 ID だけで、スコア・誤答数・経過時間・練習種別・バリアントは
 * すべて `challenge_attempts` に保管したサーバー側の状態から取る。以前は
 * クライアントが採点した値を受け取っていたため、Action を直接呼べば任意の
 * スコアをランキングに載せられた（あり得ない値だけを弾く上下限チェックで
 * 凌いでいた）。出題・採点・時計をサーバーに移したことで、申告値を信じる
 * 経路そのものが無くなった。
 *
 * 挑戦の消費と記録の書き込みは同じトランザクションで行う。同じ挑戦を並行して
 * 何度送っても記録は 1 件で、書き込みに失敗したら挑戦は未消費のまま残る。
 *
 * 昇級試験の挑戦は受け付けない。試験は記録を残さず合否だけを判定する
 * （`exam/_actions/submit-exam-result.ts`）。ここで弾くのは、試験の走行が
 * ランキング・マイレコード・EXP に紛れ込む経路を保存の入口で塞ぐため。
 *
 * 未ログインをエラーにしないのは、クライアント側で事前の認証チェックを
 * 要らなくするため。`AuthProvider` の非同期ロード中の競合で正規ユーザーが
 * 匿名扱いされるバグクラスを避け、サーバーの cookie ベースの Supabase
 * クライアントを唯一の認証ソースにする。
 *
 * @param attemptId - `beginChallenge` が発行した挑戦 ID
 */
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
