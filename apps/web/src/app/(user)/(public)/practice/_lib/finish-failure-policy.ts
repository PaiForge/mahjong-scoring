import type { SubmitExamErrorCode } from "../../exam/_actions/submit-exam-result";
import type { SaveResultErrorCode } from "../_actions/save-practice-result";

/**
 * チャレンジの終了時の送信（練習の保存・試験の採点）が返しうる失敗
 * 終了時送信エラーコード
 */
export type FinishErrorCode = SaveResultErrorCode | SubmitExamErrorCode;

/**
 * 失敗をどう扱うか
 * 失敗の種別
 *
 * - `retryable` — 一時的な失敗。同じ挑戦 ID をすぐ送り直せばよい
 * - `settled` — サーバーが答えを出した。もう送っても変わらない
 */
type FailureKind = "retryable" | "settled";

/**
 * 失敗ごとの扱いの表
 *
 * 全コードを持つ表にしているのは、Action に失敗の理由を足したとき、ここに
 * 扱いを書き足すまで型エラーになるようにするため（アプリの
 * `records/failure-policy.ts` と同じ作り）。羅列だと新しい理由が黙って
 * 「送り直さない」に落ちる。
 *
 * - `rateLimited` は送り直す。枠はインスタンスごとのインメモリなので、
 *   別のインスタンスに当たれば通る。超えている間の送り直しは数えられない
 *   （`checkIpRateLimit` は上限で止まる）ので枠を延ばさない
 * - `unexpectedError`（DB の失敗。確定はロールバック済み）・`authUnavailable`
 *   （認証サーバーの不通）は挑戦に触れていないので送り直せる
 * - `banned`・`invalidResult` はサーバーの答え。送り直しても変わらない
 */
const FAILURE_KINDS: Readonly<Record<FinishErrorCode, FailureKind>> = {
  rateLimited: "retryable",
  unexpectedError: "retryable",
  authUnavailable: "retryable",
  banned: "settled",
  invalidResult: "settled",
};

/**
 * 終了時の送信の失敗のうち、同じ挑戦 ID をすぐ送り直してよいもの
 * 再送可能な終了時失敗
 */
export function isRetryableFinishFailure(error: FinishErrorCode): boolean {
  return FAILURE_KINDS[error] === "retryable";
}
