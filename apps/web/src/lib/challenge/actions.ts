"use server";
import { authenticateAndCheckBan } from "../auth";
import {
  beginAttempt,
  answerAttempt,
  pauseAttempt,
  revealExpiredAttempt,
} from "./attempts";

/** 挑戦開始。未認証はローカルの非記録モードで遊ぶ。 */
export async function beginChallenge(
  menu: unknown,
  variant: unknown,
  settings: unknown,
) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return { error: auth.error };
  const attempt = await beginAttempt(auth.user.id, menu, variant, settings);
  return attempt ? { attempt } : { error: "invalid_challenge" };
}
/** 回答受付。本人確認は回答ごとに行う。 */
export async function answerChallenge(
  id: unknown,
  sequence: unknown,
  answer: unknown,
) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return undefined;
  return answerAttempt(auth.user.id, id, sequence, answer);
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
