import {
  MOBILE_DELETE_ACCOUNT_API_PATH,
  MOBILE_ME_API_PATH,
  MOBILE_USERNAME_API_PATH,
  isMobileUsernameErrorCode,
  parseMobileMeResponse,
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
  const userId = (await supabase?.auth.getSession())?.data.session?.user.id;
  await supabase?.auth.signOut({ scope: "local" });
  if (userId !== undefined) notifyAccountDeleted(userId);
  showDeletionNotice(status);
  return { success: true, status };
}
