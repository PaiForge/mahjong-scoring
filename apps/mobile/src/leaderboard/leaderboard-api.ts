import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import {
  MOBILE_LEADERBOARD_VISIBILITY_API_PATH,
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
  parseMobileLeaderboardVisibility,
  type MobileLeaderboardErrorCode,
  type MobileLeaderboardRanksResponse,
  type MobileLeaderboardVisibility,
} from "@mahjong-scoring/features/leaderboard/mobile-api";

import {
  apiFailureOf,
  callMobileApi,
  type ApiFailure,
} from "../auth/api-client";

/** ランキングの API の失敗 */
export type LeaderboardApiFailure = ApiFailure | MobileLeaderboardErrorCode;

/** 読み取りの結果。失敗なら理由 */
export type LeaderboardApiResult<T> =
  T | { readonly error: LeaderboardApiFailure };

/** 応答を読み、成功なら検証して返す */
async function readResponse<T extends object>(
  response: Response | ApiFailure,
  parse: (body: unknown) => T | undefined,
): Promise<LeaderboardApiResult<T>> {
  if (typeof response === "string") return { error: response };
  if (response.status === 404) return { error: "notFound" };
  if (!response.ok) return { error: await apiFailureOf(response) };
  const value = parse(await response.json().catch(() => undefined));
  return value ?? { error: "unknown" };
}

/**
 * 本人の全土俵の順位を読む（ログイン中だけ）
 * ランキング順位取得
 */
export async function fetchLeaderboardRanks(
  userId: string,
  period: LeaderboardPeriod,
): Promise<LeaderboardApiResult<MobileLeaderboardRanksResponse>> {
  return readResponse(
    await callMobileApi(mobileLeaderboardRanksApiUrl(period), {
      asUser: userId,
    }),
    parseMobileLeaderboardRanksResponse,
  );
}

/**
 * ランキングに表示しない設定を読む（ログイン中だけ）
 * ランキング非表示設定取得
 */
export async function fetchLeaderboardVisibility(
  userId: string,
): Promise<LeaderboardApiResult<MobileLeaderboardVisibility>> {
  return readResponse(
    await callMobileApi(MOBILE_LEADERBOARD_VISIBILITY_API_PATH, {
      asUser: userId,
    }),
    parseMobileLeaderboardVisibility,
  );
}

/**
 * ランキングに表示しない設定を保存する
 * ランキング非表示設定保存
 *
 * 切り替えたユーザーの名義でだけ送る（`asUser`）。
 */
export async function saveLeaderboardVisibility(
  userId: string,
  hidden: boolean,
): Promise<{ readonly success: true } | { readonly error: ApiFailure }> {
  const response = await callMobileApi(MOBILE_LEADERBOARD_VISIBILITY_API_PATH, {
    method: "POST",
    body: { hidden },
    asUser: userId,
  });
  if (typeof response === "string") return { error: response };
  if (!response.ok) return { error: await apiFailureOf(response) };
  return { success: true };
}
