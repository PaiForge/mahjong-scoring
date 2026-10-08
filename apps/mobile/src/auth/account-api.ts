import {
  MOBILE_DELETE_ACCOUNT_API_PATH,
  MOBILE_ME_API_PATH,
  MOBILE_USERNAME_API_PATH,
  isMobileDeleteAccountErrorCode,
  isMobileUsernameErrorCode,
  parseMobileMeResponse,
  type MobileDeleteAccountErrorCode,
  type MobileDeleteAccountRequest,
  type MobileDeleteAccountResponse,
  type MobileMeResponse,
  type MobileRegisterUsernameRequest,
  type MobileUsernameErrorCode,
} from "@mahjong-scoring/features/account/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  notifyAccountDeleted,
  type ApiFailure,
} from "./api-client";
import { requestAppleAuthorizationCode } from "./apple-sign-in";
import { supabase } from "./supabase-client";
import { showDeletionNotice } from "./use-deletion-notice";

export type { ApiFailure } from "./api-client";

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

/** 退会の失敗の理由 */
export type DeleteAccountFailure =
  | ApiFailure
  | MobileDeleteAccountErrorCode
  | "appleCanceled"
  | "appleNotSupported";

/**
 * 退会を受け付けてもらう。受け付けたら端末のログイン状態を捨て、知らせを出す
 * 退会
 *
 * 受け付けた後の工程はサーバーが最後まで進めるので、`pending`（一部の工程が
 * 残っている）でも成功として扱い、やり直させない。受付そのものの失敗は
 * 同じ操作でやり直せる（サーバーの受付は冪等）。
 *
 * 退会するユーザーは送る前に決め、そのユーザーの名義でだけ送る（`asUser`）。
 * 応答を待つ間に別のアカウントへログインし直していたら、端末の記録を
 * 消すのも退会したユーザーの分だけで、今のログインはそのまま残す。
 *
 * Apple でログインしたことがあり、サーバーが Apple の連携の取り消しに使う
 * トークンを持っていなければ、サーバーは `appleAuthorizationRequired` で
 * 断る。そのときは Apple で確認し直して得た認可コードを付けて 1 度だけ
 * 送り直す。
 */
export async function deleteOwnAccount(): Promise<
  | {
      readonly success: true;
      readonly status: MobileDeleteAccountResponse["status"];
    }
  | { readonly error: DeleteAccountFailure }
> {
  const userId = (await supabase?.auth.getSession())?.data.session?.user.id;
  if (userId === undefined) return { error: "unauthorized" };

  let response = await sendDeletion(userId, {});
  if (
    typeof response !== "string" &&
    response.status === 409 &&
    (await errorOf(response.clone())) === "appleAuthorizationRequired"
  ) {
    const apple = await requestAppleAuthorizationCode();
    if (apple === "canceled") return { error: "appleCanceled" };
    if (apple === "notSupported") return { error: "appleNotSupported" };
    if (apple === "failed") return { error: "appleRejected" };
    response = await sendDeletion(userId, {
      appleAuthorizationCode: apple.authorizationCode,
    });
  }
  if (typeof response === "string") return { error: response };
  if (!response.ok) {
    const error = await errorOf(response.clone());
    return {
      error: isMobileDeleteAccountErrorCode(error)
        ? error
        : await apiFailureOf(response),
    };
  }
  const body: unknown = await response.json().catch(() => undefined);
  const status =
    typeof body === "object" &&
    body !== null &&
    "status" in body &&
    body.status === "completed"
      ? "completed"
      : "pending";
  const current = (await supabase?.auth.getSession())?.data.session?.user.id;
  if (current === userId) await supabase?.auth.signOut({ scope: "local" });
  notifyAccountDeleted(userId);
  showDeletionNotice(status);
  return { success: true, status };
}

function sendDeletion(
  userId: string,
  body: MobileDeleteAccountRequest,
): ReturnType<typeof callMobileApi> {
  return callMobileApi(MOBILE_DELETE_ACCOUNT_API_PATH, {
    method: "POST",
    body,
    asUser: userId,
  });
}
