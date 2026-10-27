import type { SubmitExamErrorCode } from "../../exam/_actions/submit-exam-result";
import type {
  AnswerChallengeErrorCode,
  RevealExpiredErrorCode,
} from "../../../../../lib/challenge/actions";
import type { SaveResultErrorCode } from "../_actions/save-practice-result";

/**
 * チャレンジの終了時の送信（練習の保存・試験の採点）が返しうる失敗
 * 終了時送信エラーコード
 */
export type FinishErrorCode = SaveResultErrorCode | SubmitExamErrorCode;

/**
 * 記録付きチャレンジの Server Action（回答・時間切れの開示・終了時の送信）が
 * 返しうる失敗の全部
 * チャレンジ失敗コード
 */
export type ChallengeFailureCode =
  FinishErrorCode | AnswerChallengeErrorCode | RevealExpiredErrorCode;

/**
 * 失敗をどう扱うか
 * 失敗の種別
 *
 * - `retryable` — 一時的な失敗。同じ要求（同じ挑戦 ID・同じ番号・同じ回答）を
 *   すぐ送り直せばよい
 * - `settled` — サーバーが答えを出した。もう送っても変わらない
 */
type FailureKind = "retryable" | "settled";

/**
 * 失敗ごとの扱いの表
 *
 * 回答・開示・終了時の送信で 1 つの表を共有する。同じコードは Action が
 * 違っても同じ意味（挑戦に触れたか・触れていないか）だから。全コードを持つ
 * 表にしているのは、Action に失敗の理由を足したとき、ここに扱いを書き足す
 * まで型エラーになるようにするため（アプリの `records/failure-policy.ts` と
 * 同じ作り）。羅列だと新しい理由が黙って「送り直さない」に落ちる。
 *
 * - `rateLimited` は送り直す。枠はインスタンスごとのインメモリなので、
 *   別のインスタンスに当たれば通る。超えている間の送り直しは数えられない
 *   （`checkIpRateLimit` は上限で止まる）ので枠を延ばさない
 * - `unexpectedError`（DB の失敗。トランザクションはロールバック済み）・
 *   `authUnavailable`（認証サーバーの不通）は挑戦に触れていないので送り直せる
 * - `banned`・`unauthorized`・`invalidResult`・`rejected` はサーバーの答え。
 *   送り直しても変わらない（`rejected` は回答なら古い番号・確定済み・停止中
 *   等で挑戦が受け付けなかったもの。盤面は開始からやり直す）
 */
const FAILURE_KINDS: Readonly<Record<ChallengeFailureCode, FailureKind>> = {
  rateLimited: "retryable",
  unexpectedError: "retryable",
  authUnavailable: "retryable",
  banned: "settled",
  unauthorized: "settled",
  invalidResult: "settled",
  rejected: "settled",
};

/**
 * チャレンジの Action の失敗のうち、同じ要求をすぐ送り直してよいもの
 * 再送可能なチャレンジ失敗
 */
export function isRetryableChallengeFailure(
  error: ChallengeFailureCode,
): boolean {
  return FAILURE_KINDS[error] === "retryable";
}
