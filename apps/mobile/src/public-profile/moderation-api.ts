import {
  MOBILE_BLOCKS_API_PATH,
  isMobileModerationErrorCode,
  mobileBlockApiPath,
  mobileReportApiPath,
  mobileUnblockApiPath,
  parseMobileBlocksResponse,
  type MobileBlocksResponse,
  type MobileModerationErrorCode,
  type MobileReportRequest,
} from "@mahjong-scoring/features/moderation/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
} from "../auth/api-client";

/** ブロック・通報の API の失敗 */
export type ModerationApiFailure = ApiFailure | MobileModerationErrorCode;

/** 書き込みの結果 */
export type ModerationWriteResult =
  { readonly success: true } | { readonly error: ModerationApiFailure };

/**
 * POST を送る。404・422 は固有の理由で返す
 *
 * 操作を始めたユーザーの名義でだけ送る（`asUser`）。
 */
async function post(
  userId: string,
  path: string,
  body?: unknown,
): Promise<ModerationWriteResult> {
  const response = await callMobileApi(path, {
    method: "POST",
    body,
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 404 || response.status === 422) {
    const error = await errorOf(response);
    return { error: isMobileModerationErrorCode(error) ? error : "unknown" };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  return { success: true };
}

/**
 * 相手をブロックする
 * ブロック
 */
export function blockUser(
  userId: string,
  username: string,
): Promise<ModerationWriteResult> {
  return post(userId, mobileBlockApiPath(username));
}

/**
 * ブロックを解除する
 * ブロック解除
 */
export function unblockUser(
  userId: string,
  username: string,
): Promise<ModerationWriteResult> {
  return post(userId, mobileUnblockApiPath(username));
}

/**
 * 相手を通報する
 * 通報
 */
export function reportUser(
  userId: string,
  username: string,
  report: MobileReportRequest,
): Promise<ModerationWriteResult> {
  return post(userId, mobileReportApiPath(username), report);
}

/**
 * ブロックした人の一覧を読む
 * ブロック一覧取得
 */
export async function fetchBlockedUsers(
  userId: string,
): Promise<MobileBlocksResponse | { readonly error: ModerationApiFailure }> {
  const response = await callMobileApi(MOBILE_BLOCKS_API_PATH, {
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await apiFailureOf(response) };
  const value = parseMobileBlocksResponse(
    await response.json().catch(() => undefined),
  );
  return value ?? { error: "unknown" };
}
