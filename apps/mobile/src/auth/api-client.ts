import {
  isMobileApiErrorCode,
  type MobileApiErrorCode,
} from "@mahjong-scoring/features/account/mobile-api";

import { SITE_URL } from "../lib/app-site-url";
import { supabase } from "./supabase-client";
import { showDeletionNotice } from "./use-deletion-notice";
import {
  decideUnauthorizedRecovery,
  type Credentials,
} from "./unauthorized-recovery";

/**
 * API 呼び出しの失敗
 *
 * - `network` — 応答が得られなかった
 * - `userChanged` — 送る前に、指定したユーザーのログインではなくなっていた（送っていない）
 */
export type ApiFailure =
  MobileApiErrorCode | "network" | "userChanged" | "unknown";

/** API 呼び出しの指定 */
export interface MobileApiInit {
  readonly method?: "GET" | "POST";
  /** 要求の本文。`FormData` は multipart のまま、それ以外は JSON にして送る */
  readonly body?: unknown;
  /**
   * このユーザーとして送る。今のログインが別のユーザー（ログアウト済みを
   * 含む）なら送らずに `userChanged` を返す。端末に預けた記録（未送信の
   * レッスン完了・確定待ちのチャレンジ）を、預けたユーザー以外の名義で
   * 送らないために使う
   */
  readonly asUser?: string;
}

type AccountDeletedListener = (userId: string) => void;
const accountDeletedListeners = new Set<AccountDeletedListener>();

/**
 * 退会を受け付けたアカウントを知らせる先を登録する。解除する関数を返す
 * 退会通知購読
 *
 * 端末に預けたそのユーザーの記録・キャッシュを消すために使う。自分で
 * 退会したときも、他の端末での退会を 403 `deleted` で知ったときも呼ぶ。
 */
export function onAccountDeleted(listener: AccountDeletedListener): () => void {
  accountDeletedListeners.add(listener);
  return () => accountDeletedListeners.delete(listener);
}

/** 退会を受け付けたアカウントを、登録された先へ知らせる */
export function notifyAccountDeleted(userId: string): void {
  for (const listener of accountDeletedListeners) listener(userId);
}

/**
 * web のアプリ向け API をログイン中のトークンで呼ぶ
 * アプリAPI呼び出し
 *
 * トークンは supabase-js のセッションから取る（期限が近ければクライアントが
 * 更新済みのもの）。401 が返ったら {@link recoverFromUnauthorized} で、
 * その 401 が今のログインに当てはまるかを確かめてから扱う。認証は API の
 * 処理より前に行うので、401 の要求はサーバーで何も処理されておらず、
 * 送り直してよい。送り直すのは 1 度だけ。
 *
 * 403 `deleted`（退会を受け付けたアカウント）が返ったら、別の端末で
 * 退会した・退会の成功の応答を失ったということ。退会の工程はサーバーが
 * 進めるので、受け付けたことを知らせて端末のログインを捨てる（送った
 * ログインが今もそのままのときだけ）。
 */
export async function callMobileApi(
  path: string,
  init: MobileApiInit = {},
): Promise<Response | ApiFailure> {
  if (!supabase) return "unauthorized";
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (init.asUser !== undefined && session?.user.id !== init.asUser)
    return "userChanged";
  if (!session) return "unauthorized";
  let sent: Credentials = {
    userId: session.user.id,
    accessToken: session.access_token,
  };
  try {
    let response = await send(path, init, sent.accessToken);
    if (response.status === 401) {
      const retryToken = await recoverFromUnauthorized(sent);
      if (retryToken === undefined) return response;
      sent = { ...sent, accessToken: retryToken };
      response = await send(path, init, retryToken);
      if (response.status === 401) await signOutIfStillCurrent(sent);
    }
    if (
      response.status === 403 &&
      (await errorOf(response.clone())) === "deleted" &&
      (await signOutIfStillCurrent(sent))
    ) {
      notifyAccountDeleted(sent.userId);
      showDeletionNotice("pending");
    }
    return response;
  } catch {
    return "network";
  }
}

/** 1 回の HTTP 要求 */
function send(
  path: string,
  init: MobileApiInit,
  accessToken: string,
): Promise<Response> {
  // multipart は Content-Type を付けない — 境界（boundary）付きの値は fetch が付ける
  if (init.body instanceof FormData) {
    return fetch(`${SITE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: init.body,
    });
  }
  return fetch(`${SITE_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body === undefined
        ? {}
        : { "Content-Type": "application/json" }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

/**
 * 401 を受けた後、送り直すトークンを決める。送り直さないなら undefined
 * 401からの回復
 *
 * 判断は {@link decideUnauthorizedRecovery}。送ったトークンがまだ今のもの
 * なら（期限切れの可能性）、共有のクライアントに 1 度だけ更新させる。更新が
 * 通信の失敗ならログインは残す（障害でログインを捨てない）。更新が拒まれた
 * （取り消し・削除）ときは supabase-js 自身がセッションを消す。
 */
async function recoverFromUnauthorized(
  sent: Credentials,
): Promise<string | undefined> {
  if (!supabase) return undefined;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const recovery = decideUnauthorizedRecovery(
    sent,
    session
      ? { userId: session.user.id, accessToken: session.access_token }
      : undefined,
  );
  switch (recovery.kind) {
    case "ignore":
      return undefined;
    case "retry":
      return recovery.accessToken;
    case "refresh": {
      const { data } = await supabase.auth.refreshSession();
      const refreshed = data.session;
      return refreshed &&
        refreshed.user.id === sent.userId &&
        refreshed.access_token !== sent.accessToken
        ? refreshed.access_token
        : undefined;
    }
    default: {
      const exhaustive: never = recovery;
      return exhaustive;
    }
  }
}

/**
 * サーバーがこのログインを認めない（新しいトークンでも 401・退会を受け付けた）
 * とき、その間に別のログインへ変わっていなければ、この端末のログイン状態を
 * 捨てる。捨てたら true
 */
async function signOutIfStillCurrent(sent: Credentials): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { session: current },
  } = await supabase.auth.getSession();
  if (current?.user.id !== sent.userId) return false;
  await supabase.auth.signOut({ scope: "local" });
  return true;
}

/** 失敗の応答の `error` を読む。形が違えば undefined */
export async function errorOf(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => undefined);
  return typeof body === "object" && body !== null && "error" in body
    ? body.error
    : undefined;
}

/** 失敗の応答を {@link ApiFailure} に丸める */
export async function apiFailureOf(response: Response): Promise<ApiFailure> {
  const error = await errorOf(response);
  return isMobileApiErrorCode(error) ? error : "unknown";
}
