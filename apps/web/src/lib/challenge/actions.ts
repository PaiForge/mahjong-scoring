"use server";
/**
 * 記録付きチャレンジの Server Action（開始・回答・一時停止・時間切れの開示）
 * チャレンジアクション
 *
 * @design 認証の前に IP の枠を数えない
 *
 * どの Action も先に `authenticateAndCheckBan()`（Supabase の `getUser()` の
 * 往復）を呼び、枠は開始だけを認証の後に IP で数える（結果送信は
 * `savePracticeResult` / `submitExamResult` がアカウントで数える）。アプリ向け
 * API（`authorizeMobileRequest`）のように認証の前に IP の枠を置く案は、
 * 次の理由で採らなかった（2026-10）。
 *
 * - **cookie の無い要求は認証サーバーへ行かない。** `getUser()` は cookie に
 *   セッションが無ければ手元で `AuthSessionMissingError` を返す
 *   （auth-js 2.112 の `_getUser` → `__loadSession`）。往復が起きるのは
 *   形だけ整えた偽の cookie（`access_token` / `refresh_token` / `expires_at`
 *   を持つ JSON）を付けたときで、それは認証を要するあらゆる Server Action と
 *   ページ（`getClaims()` も期限切れの形ならリフレッシュに行く）で同じ。
 *   この 4 つに枠を足しても入口の 1 つを狭めるだけで、同じ往復は他の入口から
 *   起こせる。塞ぐなら全要求に掛かる層（Vercel の Firewall のレート制限、
 *   または `proxy.ts`）で、Action ごとのインメモリの枠（インスタンスごとに
 *   別で、コールドスタートで消える）では守れない
 * - **IP の枠は回答を巻き添えにする。** 回答は 1 回のチャレンジで数十回飛び、
 *   弾かれた回答は undefined になって盤面が「通信に失敗」で止まり、その回は
 *   未確定のまま失われる（結果送信と違って送り直しが無い）。共有 NAT で
 *   N 人が同時に遊ぶと N × 数十回 / 分で、アプリの `answerChallenge` の
 *   600 回 / 10 分でも十数人の教室で届く。記録を失わないことを優先する
 * - 未認証の人は開始の応答で非記録モードへ落ちる経路を持つ。認証の前に
 *   弾くと、その人は記録無しでも遊べなくなる
 *
 * アカウント単位の枠（`enforceUserRateLimit`）は NAT と無関係なので回答にも
 * 足せるが、認証の後に数えるので「認証サーバーへの往復を絞る」目的には
 * 効かない。足すなら目的は DB の行ロックの連打を止めることで、弾かれた回答を
 * 盤面が送り直せるようにしてからにする。
 */
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
 * だけで、未認証の人が非記録モードへ落ちる経路を枠で塞がないため
 * （認証の前に IP で数えない理由はモジュールの TSDoc）。
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
  return answerAttempt(auth.user.id, id, sequence, answer, { receivedAt });
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
