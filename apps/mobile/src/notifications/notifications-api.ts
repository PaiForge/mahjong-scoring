import {
  MOBILE_NOTIFICATIONS_READ_API_PATH,
  mobileNotificationsApiUrl,
  parseMobileNotificationsResponse,
  type MobileNotificationsReadRequest,
  type MobileNotificationsResponse,
} from "@mahjong-scoring/features/notifications/mobile-api";

import { callMobileApi, type ApiFailure } from "../auth/api-client";
import { readMobileApi } from "../auth/request-mobile-api";
import {
  mypageFailureOf,
  type MypageApiFailure,
  type MypageApiResult,
} from "../mypage/mypage-api";

/**
 * 通知の一覧の 1 ページと未読数を読む
 * 通知一覧取得
 *
 * 読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 *
 * @param page - 1 始まりのページ番号
 */
export function fetchNotifications(
  userId: string,
  page: number,
): Promise<MypageApiResult<MobileNotificationsResponse>> {
  return readMobileApi(
    mobileNotificationsApiUrl(page),
    { asUser: userId },
    parseMobileNotificationsResponse,
    mypageFailureOf,
  );
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
  if (!response.ok) return { error: await mypageFailureOf(response) };
  return { success: true };
}
