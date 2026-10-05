"use server";
import { authenticateAndCheckBan } from "../auth";
import { enforceIpRateLimit } from "../rate-limit-ip";
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
 */
export async function answerChallenge(
  id: unknown,
  sequence: unknown,
  answer: unknown,
) {
  const receivedAt = Date.now();
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return undefined;
  return answerAttempt(auth.user.id, id, sequence, answer, receivedAt);
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
