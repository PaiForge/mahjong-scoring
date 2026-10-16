import { isMobileMypageErrorCode } from "@mahjong-scoring/features/mypage/mobile-api";
import {
  MOBILE_NOTIFICATIONS_READ_API_PATH,
  mobileNotificationsApiUrl,
  parseMobileNotificationsResponse,
  type MobileNotificationsReadRequest,
  type MobileNotificationsResponse,
} from "@mahjong-scoring/features/notifications/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
} from "../auth/api-client";
import { readJson } from "../auth/read-json";
import type { MypageApiFailure, MypageApiResult } from "../mypage/mypage-api";

/**
 * 応答の 409 を `usernameRequired` に、それ以外の失敗を認証の理由に丸める
 *
 * 通知はマイページと同じくユーザー名を決めた人のもので、失敗の理由も
 * マイページと同じ集合（`useMypageRead` がそのまま扱える）。
 */
async function failureOf(response: Response): Promise<MypageApiFailure> {
  if (response.status === 409) {
    const error = await errorOf(response);
    return isMobileMypageErrorCode(error) ? error : "unknown";
  }
  return apiFailureOf(response);
}

/**
 * 通知の一覧の 1 ページと未読数を読む
 * 通知一覧取得
 *
 * 読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 *
 * @param page - 1 始まりのページ番号
 */
export async function fetchNotifications(
  userId: string,
  page: number,
): Promise<MypageApiResult<MobileNotificationsResponse>> {
  const response = await callMobileApi(mobileNotificationsApiUrl(page), {
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await failureOf(response) };
  const value = parseMobileNotificationsResponse(await readJson(response));
  return value ?? { error: "unknown" };
}

/**
 * 通知を既読にする（1 件か、未読のすべて）
 * 通知既読化
 *
 * 既読にしたユーザーの名義でだけ送る（`asUser`）。
 */
export async function markNotificationsRead(
  userId: string,
  request: MobileNotificationsReadRequest,
): Promise<
  { readonly success: true } | { readonly error: MypageApiFailure | ApiFailure }
> {
  const response = await callMobileApi(MOBILE_NOTIFICATIONS_READ_API_PATH, {
    method: "POST",
    body: request,
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await failureOf(response) };
  return { success: true };
}
