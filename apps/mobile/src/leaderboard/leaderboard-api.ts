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
import { readMobileApi, type MobileApiValue } from "../auth/request-mobile-api";

/** ランキングの API の失敗 */
export type LeaderboardApiFailure = ApiFailure | MobileLeaderboardErrorCode;

/** 読み取りの結果。失敗なら理由 */
export type LeaderboardApiResult<T> = MobileApiValue<T, LeaderboardApiFailure>;

/** 失敗の応答を理由に丸める。404 は期間が無い（`notFound`） */
function leaderboardFailureOf(
  response: Response,
): Promise<LeaderboardApiFailure> {
  return response.status === 404
    ? Promise.resolve("notFound")
    : apiFailureOf(response);
}

/** GET を本人の名義で送り、成功なら応答を検証して返す */
function read<T extends object>(
  userId: string,
  path: string,
  parse: (body: unknown) => T | undefined,
): Promise<LeaderboardApiResult<T>> {
  return readMobileApi(path, { asUser: userId }, parse, leaderboardFailureOf);
}

/**
 * 本人の全土俵の順位を読む（ログイン中だけ）
 * ランキング順位取得
 */
export function fetchLeaderboardRanks(
  userId: string,
  period: LeaderboardPeriod,
): Promise<LeaderboardApiResult<MobileLeaderboardRanksResponse>> {
  return read(
    userId,
    mobileLeaderboardRanksApiUrl(period),
    parseMobileLeaderboardRanksResponse,
  );
}

/**
 * ランキングに表示しない設定を読む（ログイン中だけ）
 * ランキング非表示設定取得
 */
export function fetchLeaderboardVisibility(
  userId: string,
): Promise<LeaderboardApiResult<MobileLeaderboardVisibility>> {
  return read(
    userId,
    MOBILE_LEADERBOARD_VISIBILITY_API_PATH,
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
