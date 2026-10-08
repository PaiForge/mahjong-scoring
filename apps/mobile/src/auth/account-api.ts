import {
  MOBILE_DELETE_ACCOUNT_API_PATH,
  MOBILE_ME_API_PATH,
  MOBILE_USERNAME_API_PATH,
  isMobileApiErrorCode,
  isMobileUsernameErrorCode,
  parseMobileMeResponse,
  type MobileApiErrorCode,
  type MobileDeleteAccountResponse,
  type MobileMeResponse,
  type MobileRegisterUsernameRequest,
  type MobileUsernameErrorCode,
} from "@mahjong-scoring/features/account/mobile-api";

import { SITE_URL } from "../lib/app-site-url";
import { supabase } from "./supabase-client";
import { showDeletionNotice } from "./use-deletion-notice";
import {
  decideUnauthorizedRecovery,
  type Credentials,
} from "./unauthorized-recovery";

/** API 呼び出しの失敗。`network` は応答が得られなかったとき */
export type ApiFailure = MobileApiErrorCode | "network" | "unknown";

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
async function callMobileApi(
  path: string,
  init: { readonly method?: "GET" | "POST"; readonly body?: unknown } = {},
): Promise<Response | ApiFailure> {
  if (!supabase) return "unauthorized";
  const {
    data: { session },
  } = await supabase.auth.getSession();
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
  init: { readonly method?: "GET" | "POST"; readonly body?: unknown },
  accessToken: string,
): Promise<Response> {
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
async function errorOf(response: Response): Promise<unknown> {
  const body: unknown = await response.json().catch(() => undefined);
  return typeof body === "object" && body !== null && "error" in body
    ? body.error
    : undefined;
}

/** 失敗の応答を {@link ApiFailure} に丸める */
async function apiFailureOf(response: Response): Promise<ApiFailure> {
  const error = await errorOf(response);
  return isMobileApiErrorCode(error) ? error : "unknown";
}

/**
 * ログイン中のアカウントの状態を読む
 * アカウント状態取得
 */
export async function fetchAccount(): Promise<
  MobileMeResponse | { readonly error: ApiFailure }
> {
  const response = await callMobileApi(MOBILE_ME_API_PATH);
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await apiFailureOf(response) };
  const account = parseMobileMeResponse(
    await response.json().catch(() => undefined),
  );
  return account ?? { error: "unknown" };
}

/**
 * ユーザー名を決めてプロフィールを作る
 * ユーザー名登録
 */
export async function registerUsername(
  request: MobileRegisterUsernameRequest,
): Promise<
  | { readonly success: true }
  | { readonly error: ApiFailure | MobileUsernameErrorCode }
> {
  const response = await callMobileApi(MOBILE_USERNAME_API_PATH, {
    method: "POST",
    body: request,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 422) {
    const error = await errorOf(response);
    return { error: isMobileUsernameErrorCode(error) ? error : "unknown" };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  return { success: true };
}

/**
 * 退会を受け付けてもらう。受け付けたら端末のログイン状態を捨て、知らせを出す
 * 退会
 *
 * 受け付けた後の工程はサーバーが最後まで進めるので、`pending`（一部の工程が
 * 残っている）でも成功として扱い、やり直させない。受付そのものの失敗は
 * 同じ操作でやり直せる（サーバーの受付は冪等）。
 */
export async function deleteOwnAccount(): Promise<
  | {
      readonly success: true;
      readonly status: MobileDeleteAccountResponse["status"];
    }
  | { readonly error: ApiFailure }
> {
  const response = await callMobileApi(MOBILE_DELETE_ACCOUNT_API_PATH, {
    method: "POST",
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await apiFailureOf(response) };
  const body: unknown = await response.json().catch(() => undefined);
  const status =
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    body.status === "completed"
      ? "completed"
      : "pending";
  await supabase?.auth.signOut({ scope: "local" });
  showDeletionNotice(status);
  return { success: true, status };
}
