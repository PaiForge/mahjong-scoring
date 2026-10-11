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
 * 競技時間に数えないため（`answerAttempt` の `receivedAt`）。認証や行ロックの
 * 後に取ると、その処理時間ぶん画面の時計が同期の瞬間に前へ跳ぶ。ローカル
 * （処理が数 ms）では見えず、本番（数十〜百数十 ms）で初めて「止まって
 * いない」ように見える（2026-10 に本番で確認）。
 *
 * 回答ごとの本人確認を `getClaims()` のローカル検証に替え、BAN 判定を開始時と
 * 確定時だけにする案は見送った。縮むのは定常 170ms の往復のうち 40ms ほどで、
 * 体感の主因（挑戦の最初の回答だけに出るコールドスタート。実測値は
 * `RESPONSE_GRACE_MS` の TSDoc）には効かず、失効・BAN の窓が挑戦行の有効期限
 * 24 時間ぶん開く。正解をクライアントへ先渡しして楽観的に色を付ける案も採らない
 * （改造クライアントが正答を読める）。段階ごとの計測コードは結果を得た後に
 * 外した。再計測するなら `4093807a`（Merge branch 'answer-latency-telemetry'）を
 * 参照して入れ直す。
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
