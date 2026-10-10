import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import {
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
  type MobileLeaderboardErrorCode,
  type MobileLeaderboardRanksResponse,
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
