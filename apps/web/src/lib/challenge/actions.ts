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
 * 回答はアカウント単位の枠（`enforceUserRateLimit`。アプリの回答と同じ
 * `answerChallenge` の枠）で数える。NAT と無関係なので回答を巻き添えに
 * しないが、認証の後に数えるので「認証サーバーへの往復を絞る」目的には
 * 効かない。目的は 1 アカウントによる行ロックのトランザクション
 * （`answerAttempt`）の連打を止めることだけ。弾かれた回答は
 * `{ error: "rateLimited" }` で返り、盤面が同じ番号・同じ回答を送り直す
 * （`useVerifiedChallenge` の `grade`。サーバーは直前の問題への同じ回答の
 * 再送に採点し直さず同じ応答を返すので、送り直しは安全）。
 *
 * @design 失敗の理由を返す
 *
 * 回答・時間切れの開示は、受け付けなかった理由を `{ error }` で返す。盤面は
 * 「送り直してよい失敗」（枠・認証サーバーの不通・DB の失敗・通信の例外）と
 * 「受け付けられなかった」（未ログイン・BAN・古い番号や確定済み等の拒否）を
 * 分けて扱う（分け方の表は `practice/_lib/challenge-failure-policy.ts`）。
 * 以前はどれも undefined で、盤面は区別できずに「通信に失敗」で止めていた。
 * 一時停止（`pauseChallenge`）だけは boolean のまま — 要求中も画面の時計は
 * 動いているので自動で送り直すと止めたい時間が延びる。届かなければ利用者が
 * もう一度押す（同じ状態への再送は冪等）。
 */
import {
  authenticateAndCheckBan,
  isVerifiedUserUnavailable,
  type AuthGateErrorCode,
} from "../auth";
import { logExternalError } from "../log-error";
import {
  enforceIpRateLimit,
  enforceUserRateLimit,
  type RateLimitErrorCode,
} from "../rate-limit-ip";
import type { AnswerResponse } from "./answer-decision";
import {
  beginAttempt,
  answerAttempt,
  pauseAttempt,
  revealExpiredAttempt,
} from "./attempts";

/**
 * チャレンジの Action の本人確認で弾く理由
 * チャレンジ認証エラーコード
 *
 * `authUnavailable` は認証サーバーが答えられず、ログイン済みかどうかが
 * 分からなかった。未ログイン（`unauthorized`）と区別し、盤面は同じ要求を
 * 送り直す（`resolveRecorder` の `authUnavailable` と同じ扱い）。
 */
type ChallengeAuthErrorCode = AuthGateErrorCode | "authUnavailable";

/**
 * `answerChallenge` が受け付けなかった理由
 * 回答エラーコード
 *
 * - `unauthorized` / `banned` — 本人確認で弾いた。送り直しても変わらない
 * - `authUnavailable` — 認証サーバーが答えられなかった。挑戦には触れて
 *   いないので送り直せる
 * - `rateLimited` — 同じアカウントの回答が枠（`IP_RATE_LIMITS.answerChallenge`）
 *   を超えた。挑戦には触れずに返すので送り直せる（超えている間の送り直しは
 *   数えない）
 * - `rejected` — 挑戦が受け付けなかった。存在しない・他人の挑戦、古い番号へ
 *   の別の回答、確定済み、早押し、停止中、受付期限切れ、ミス上限後、目標
 *   到達後。送り直しても変わらない（`decideChallengeAnswer` の `rejected`）
 * - `unexpectedError` — DB の失敗等。トランザクションはロールバック済みで
 *   回答は数えられていないので送り直せる
 */
export type AnswerChallengeErrorCode =
  ChallengeAuthErrorCode | RateLimitErrorCode | "rejected" | "unexpectedError";

/**
 * `answerChallenge` の応答
 * 回答応答
 *
 * 採点できたら {@link AnswerResponse}、制限時間を使い切っていたら
 * `{ expired: true }`、受け付けなかったら `{ error }`
 * （{@link AnswerChallengeErrorCode}）。
 */
export type AnswerChallengeResponse =
  | AnswerResponse
  | { readonly expired: true }
  | { readonly error: AnswerChallengeErrorCode };

/**
 * `revealExpiredChallenge` が返さなかった理由。枠は無いので `rateLimited` は返らない
 * 開示エラーコード
 */
export type RevealExpiredErrorCode = Exclude<
  AnswerChallengeErrorCode,
  RateLimitErrorCode
>;

/**
 * `revealExpiredChallenge` の応答
 * 開示応答
 *
 * 期限前は残り時間、期限後は出ていた問題、返せなければ `{ error }`
 * （{@link RevealExpiredErrorCode}。`rejected` は存在しない・他人・確定済み・
 * 停止中の挑戦）。
 */
export type RevealExpiredResponse =
  | { readonly remainingMs: number }
  | { readonly question: AnswerResponse["question"] }
  | { readonly error: RevealExpiredErrorCode };

/**
 * チャレンジの Action の本人確認。認証サーバーの不通を未ログインと分ける
 *
 * `isVerifiedUserUnavailable` は同じリクエスト内の問い合わせの結果を読む
 * だけで、往復は増えない。
 */
async function authenticateForChallenge(): Promise<
  | { readonly user: { readonly id: string } }
  | { readonly error: ChallengeAuthErrorCode }
> {
  const auth = await authenticateAndCheckBan();
  if (!("error" in auth)) return auth;
  if (auth.error === "unauthorized" && (await isVerifiedUserUnavailable()))
    return { error: "authUnavailable" };
  return auth;
}

/**
 * 挑戦開始。未認証はローカルの非記録モードで遊ぶ。
 *
 * レートリミットは認証の後に数える。行を作るのはログイン済みの呼び出し
 * だけで、未認証の人が非記録モードへ落ちる経路を枠で塞がないため
 * （認証の前に IP で数えない理由はモジュールの TSDoc）。
 *
 * 認証サーバーが答えられなかったときは `unauthorized` ではなく
 * `authUnavailable` を返す。`unauthorized` は盤面が非記録モードに読み替える
 * ので、ログイン済みの人が不通の間だけ記録無しで遊ばされないようにする
 * （盤面は「通信に失敗」で止めてやり直させる）。
 */
export async function beginChallenge(
  menu: unknown,
  variant: unknown,
  settings: unknown,
) {
  const auth = await authenticateForChallenge();
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
): Promise<AnswerChallengeResponse> {
  const receivedAt = Date.now();
  const auth = await authenticateForChallenge();
  if ("error" in auth) return { error: auth.error };
  const rateLimited = enforceUserRateLimit(auth.user.id, "answerChallenge");
  if (rateLimited) return rateLimited;
  try {
    const result = await answerAttempt(auth.user.id, id, sequence, answer, {
      receivedAt,
    });
    return result ?? { error: "rejected" };
  } catch (error) {
    logExternalError("answerChallenge", "answer failed", error);
    return { error: "unexpectedError" };
  }
}
/**
 * 挑戦の一時停止・再開。届かなければ false
 *
 * 失敗の理由は返さない（モジュールの TSDoc「失敗の理由を返す」）。盤面は
 * false なら画面の一時停止を切り替えず、利用者がもう一度押す。
 */
export async function pauseChallenge(id: unknown, paused: unknown) {
  const auth = await authenticateAndCheckBan();
  if ("error" in auth) return false;
  return pauseAttempt(auth.user.id, id, paused);
}

/**
 * 制限時間後に、結果一覧用の未回答問題を取得する。
 *
 * 読むだけで行をロックしないので枠は数えない。返せなかった理由は
 * {@link RevealExpiredResponse} の `error` で返し、盤面は一時的な失敗なら
 * 同じ挑戦 ID で読み直す。
 */
export async function revealExpiredChallenge(
  id: unknown,
): Promise<RevealExpiredResponse> {
  const auth = await authenticateForChallenge();
  if ("error" in auth) return { error: auth.error };
  try {
    const result = await revealExpiredAttempt(auth.user.id, id);
    return result ?? { error: "rejected" };
  } catch (error) {
    logExternalError("revealExpiredChallenge", "reveal failed", error);
    return { error: "unexpectedError" };
  }
}
