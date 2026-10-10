import {
  MOBILE_MYPAGE_API_PATH,
  isMobileMypageErrorCode,
  parseMobileMypageResponse,
  type MobileMypageErrorCode,
  type MobileMypageResponse,
} from "@mahjong-scoring/features/mypage/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  errorOf,
  type ApiFailure,
} from "../auth/api-client";

/** マイページの API の失敗 */
export type MypageApiFailure = ApiFailure | MobileMypageErrorCode;

/**
 * マイページのトップの材料を読む
 * マイページ取得
 *
 * 読んでいる間に別のユーザーへ切り替わったら送らない（`asUser`）。
 */
export async function fetchMypage(
  userId: string,
): Promise<MobileMypageResponse | { readonly error: MypageApiFailure }> {
  const response = await callMobileApi(MOBILE_MYPAGE_API_PATH, {
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (response.status === 409) {
    const error = await errorOf(response);
    return { error: isMobileMypageErrorCode(error) ? error : "unknown" };
  }
  if (!response.ok) return { error: await apiFailureOf(response) };
  const mypage = parseMobileMypageResponse(
    await response.json().catch(() => undefined),
  );
  return mypage ?? { error: "unknown" };
}
