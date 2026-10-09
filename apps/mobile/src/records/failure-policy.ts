import type { MobileChallengeStatus } from "@mahjong-scoring/features/challenge/mobile-api";

import type { RecordsApiFailure, RecordsApiResult } from "./records-api";

/**
 * 失敗のうち、通信や一時的な障害で、同じ要求を後で送り直せばよいもの
 * 再送可能な失敗
 */
export function isRetryableFailure(error: RecordsApiFailure): boolean {
  return (
    error === "network" ||
    error === "serverError" ||
    error === "authUnavailable" ||
    error === "rateLimited"
  );
}

/**
 * 確定の失敗が「もう送っても変わらない」ものか
 * 確定済みの失敗
 *
 * 通信・一時的な障害、ログインが変わった・切れたものは、後で送れば
 * 通るかもしれないので残す。サーバーが答えを出したもの（まだ終わって
 * いない・記録できない・見つからない）は確定したものとして扱う。
 */
export function isSettled(error: RecordsApiFailure): boolean {
  if (isRetryableFailure(error)) return false;
  return (
    error === "notFinished" ||
    error === "invalidChallenge" ||
    error === "conflict" ||
    error === "invalidRequest"
  );
}

/**
 * 確定待ちのチャレンジをどう扱うか
 * 確定待ちの扱い
 *
 * - `recorded` — 記録できた。確定待ちから外す
 * - `drop` — 送り直しても変わらない。記録せずに確定待ちから外す
 * - `keep` — 確定待ちに残し、次の確定待ちへ進む
 * - `stop` — 通信できない。確定待ちに残し、送り直しを打ち切る
 */
export type PendingFinishDecision = "recorded" | "drop" | "keep" | "stop";

/**
 * 確定し直した応答から扱いを決める
 * 確定待ちの判定
 *
 * サーバーが「まだ終わっていない」と答えたときは、応答だけでは決まらない
 * （画面の時計がサーバーより先に切れただけかもしれない）ので
 * `checkStatus` を返す。呼び出し側は状態を読んで
 * {@link decidePendingFinishByStatus} で決める。
 */
export function decidePendingFinish(
  finished: RecordsApiResult<unknown>,
): PendingFinishDecision | "checkStatus" {
  if ("value" in finished) return "recorded";
  if (!isSettled(finished.error)) return "stop";
  if (finished.error === "notFinished") return "checkStatus";
  return "drop";
}

/**
 * 「まだ終わっていない」と答えたチャレンジを、今の状態から扱いを決める
 * 未確定チャレンジの判定
 *
 * 時間が残っていて止まっていなければ、期限が来れば確定できるので残す。
 * 状態を読めなかったときも残し、通信できないなら打ち切る。
 */
export function decidePendingFinishByStatus(
  status: RecordsApiResult<
    Pick<MobileChallengeStatus, "paused" | "remainingMs">
  >,
): Exclude<PendingFinishDecision, "recorded"> {
  if ("error" in status)
    return isRetryableFailure(status.error) ? "stop" : "keep";
  if (!status.value.paused && status.value.remainingMs > 0) return "keep";
  return "drop";
}

/**
 * 解いていたチャレンジの後始末で、確定の応答を受けて預かりから外してよいか
 * 解答中チャレンジの破棄判定
 *
 * 確定できた、またはもう送っても変わらないなら外す。通信できないなら
 * 次の同期まで残す。
 */
export function canDropActiveChallenge(
  finished: RecordsApiResult<unknown>,
): boolean {
  return "value" in finished || isSettled(finished.error);
}
