"use server";
import { authenticateAndCheckBan } from "../auth";
import { enforceIpRateLimit } from "../rate-limit-ip";
import {
  createPhaseStopwatch,
  logAnswerTiming,
  parseAnswerObservation,
} from "./answer-telemetry";
import {
  beginAttempt,
  answerAttempt,
  pauseAttempt,
  revealExpiredAttempt,
} from "./attempts";

/**
 * 挑戦開始。未認証はローカルの非記録モードで遊ぶ。
 *
 * レートリミットは認証の後に数える。行を作るのはログイン済みの呼び出し
 * だけで、未認証の人が非記録モードへ落ちる経路を枠で塞がないため。
 */
export async function beginChallenge(
  menu: unknown,
  variant: unknown,
  settings: unknown,
) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return { error: auth.error };
  const rateLimited = await enforceIpRateLimit("beginChallenge");
  if (rateLimited) return rateLimited;
  const attempt = await beginAttempt(auth.user.id, menu, variant, settings);
  return attempt ? { attempt } : { error: "invalid_challenge" };
}
/**
 * 回答受付。本人確認は回答ごとに行う。
 *
 * 受け取った時刻は本人確認より前に取る。確認と採点に掛かる時間を
 * 競技時間に数えないため（`answerAttempt` の `receivedAt`）。
 *
 * 段階ごとの所要時間を測り、結果と一緒に 1 行のログに出す
 * （{@link logAnswerTiming}）。
 *
 * @param observation - クライアントの観測値（{@link parseAnswerObservation}）。
 *   ログに載せるだけで、採点にも時計にも使わない
 */
export async function answerChallenge(
  id: unknown,
  sequence: unknown,
  answer: unknown,
  observation?: unknown,
) {
  const receivedAt = Date.now();
  const stopwatch = createPhaseStopwatch();
  const auth = await authenticateAndCheckBan(stopwatch.lap);
  const result =
    "error" in auth
      ? undefined
      : await answerAttempt(
          auth.user.id,
          id,
          sequence,
          answer,
          receivedAt,
          stopwatch.lap,
        );
  logAnswerTiming({
    handling:
      "error" in auth
        ? "unauthorized"
        : result === undefined
          ? "rejected"
          : "expired" in result
            ? "expired"
            : "answered",
    menuType: result && "menuType" in result ? result.menuType : undefined,
    sequence: Number.isInteger(sequence) ? Number(sequence) : undefined,
    phases: stopwatch.phases,
    totalMs: stopwatch.elapsed(),
    observation: parseAnswerObservation(observation),
  });
  return result;
}
/** 挑戦の一時停止・再開。 */
export async function pauseChallenge(id: unknown, paused: unknown) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return false;
  return pauseAttempt(auth.user.id, id, paused);
}

/** 制限時間後に、結果一覧用の未回答問題を取得する。 */
export async function revealExpiredChallenge(id: unknown) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return undefined;
  return revealExpiredAttempt(auth.user.id, id);
}
