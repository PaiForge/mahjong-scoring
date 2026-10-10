import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import {
  mobileLeaderboardApiUrl,
  mobileLeaderboardRanksApiUrl,
  parseMobileLeaderboardRanksResponse,
  parseMobileLeaderboardResponse,
  type MobileLeaderboardErrorCode,
  type MobileLeaderboardRanksResponse,
  type MobileLeaderboardResponse,
} from "@mahjong-scoring/features/leaderboard/mobile-api";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

import {
  apiFailureOf,
  callMobileApi,
  callMobileApiAsViewer,
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
 * ある土俵・期間のランキングの 1 ページを読む
 * ランキング取得
 *
 * @param viewerId - ログイン中のユーザー。ゲストなら undefined
 * @param page - 1 始まりのページ番号
 */
export async function fetchLeaderboard(
  viewerId: string | undefined,
  period: LeaderboardPeriod,
  board: PracticeBoard,
  page: number,
): Promise<LeaderboardApiResult<MobileLeaderboardResponse>> {
  return readResponse(
    await callMobileApiAsViewer(
      mobileLeaderboardApiUrl(period, board, page),
      viewerId,
    ),
    parseMobileLeaderboardResponse,
  );
}
