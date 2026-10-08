import {
  MOBILE_DELETE_ACCOUNT_API_PATH,
  MOBILE_ME_API_PATH,
  MOBILE_USERNAME_API_PATH,
  isMobileApiErrorCode,
  isMobileUsernameErrorCode,
  parseMobileMeResponse,
  type MobileApiErrorCode,
  type MobileMeResponse,
  type MobileRegisterUsernameRequest,
  type MobileUsernameErrorCode,
} from "@mahjong-scoring/features/account/mobile-api";

import { SITE_URL } from "../lib/app-site-url";
import { supabase } from "./supabase-client";

/** API 呼び出しの失敗。`network` は応答が得られなかったとき */
export type ApiFailure = MobileApiErrorCode | "network" | "unknown";

/**
 * web のアプリ向け API をログイン中のトークンで呼ぶ
 * アプリAPI呼び出し
 *
 * トークンは supabase-js のセッションから取る（期限が近ければクライアントが
 * 更新済みのもの）。401（失効・退会済み）が返ったら、端末のログイン状態も
 * 捨てる — サーバーが本人と認めないトークンを持ち続けても、何も書けない。
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
  try {
    const response = await fetch(`${SITE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        ...(init.body === undefined
          ? {}
          : { "Content-Type": "application/json" }),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
    if (response.status === 401) {
      await supabase.auth.signOut({ scope: "local" });
    }
    return response;
  } catch {
    return "network";
  }
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
 * アカウントを削除する。成功したら端末のログイン状態も捨てる
 * 退会
 *
 * 失敗しても同じ操作でやり直せる（サーバーの退会は冪等）。
 */
export async function deleteOwnAccount(): Promise<
  { readonly success: true } | { readonly error: ApiFailure }
> {
  const response = await callMobileApi(MOBILE_DELETE_ACCOUNT_API_PATH, {
    method: "POST",
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await apiFailureOf(response) };
  await supabase?.auth.signOut({ scope: "local" });
  return { success: true };
}
