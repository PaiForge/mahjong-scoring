import {
  mobilePublicProfileApiPath,
  parseMobilePublicProfileResponse,
  type MobilePublicProfileErrorCode,
  type MobilePublicProfileResponse,
} from "@mahjong-scoring/features/public-profile/mobile-api";

import {
  apiFailureOf,
  callMobileApiAsViewer,
  type ApiFailure,
} from "../auth/api-client";

/** 公開プロフィールの API の失敗 */
export type PublicProfileApiFailure = ApiFailure | MobilePublicProfileErrorCode;

/**
 * ある人の公開プロフィールを読む
 * 公開プロフィール取得
 *
 * @param viewerId - ログイン中のユーザー。ゲストなら undefined
 */
export async function fetchPublicProfile(
  viewerId: string | undefined,
  username: string,
): Promise<
  MobilePublicProfileResponse | { readonly error: PublicProfileApiFailure }
> {
  const response = await callMobileApiAsViewer(
    mobilePublicProfileApiPath(username),
    viewerId,
  );
  if (typeof response === "string") return { error: response };
  if (response.status === 404) return { error: "notFound" };
  if (!response.ok) return { error: await apiFailureOf(response) };
  const value = parseMobilePublicProfileResponse(
    await response.json().catch(() => undefined),
  );
  return value ?? { error: "unknown" };
}
