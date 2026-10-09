import "server-only";

import type { NextResponse } from "next/server";

import type {
  MobileRecordResultsResponse,
  MobileRecordsResponse,
} from "@mahjong-scoring/features/my-record/mobile-api";
import {
  getPeriodRange,
  getPreviousPeriodRange,
} from "@mahjong-scoring/features/my-record/period";
import { resolveRequestedBoard } from "@mahjong-scoring/features/my-record/requested-board";
import { isDatePeriod } from "@mahjong-scoring/features/my-record/types";
import { practiceBoardKey } from "@mahjong-scoring/features/practice-menu-types";

import {
  fetchAvailableBoards,
  fetchChallengeAttempts,
  getChallengeResultsPaginated,
} from "@/app/(user)/(protected)/(confirmed)/mypage/challenges/_lib/queries";
import { parsePageParam } from "../pagination";

import { authorizeMobileRequest } from "./auth";
import { usernameRequired } from "./mypage";
import { mobileJson, mobileServerError } from "./response";

/** URL クエリを `resolveRequestedBoard` が読む形にする */
function queryOf(request: Request): Record<string, string> {
  return Object.fromEntries(new URL(request.url).searchParams);
}

/**
 * マイレコードのダッシュボードの材料を返す（アプリ向け）
 * マイレコードAPI（アプリ向け）
 *
 * web のマイレコードのページ（初期表示）と Server Action（選び直し）を
 * 1 本にしたもの。クエリの `menu` / `variant` / `period` で土俵と期間を
 * 選ぶ（`createdAt` は JSON で ISO 8601 の文字列になる）。記録の無い土俵・マイレコードが扱わない土俵（昇級試験）・不正な値は
 * 先頭の土俵に、不正な期間は今週に落とす（web と同じ）。期間の境界は
 * 要求を受けた時刻の JST で切る。
 */
export async function handleReadRecords(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileRecords");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const userId = auth.user.id;
  const query = queryOf(request);
  const period = isDatePeriod(query.period) ? query.period : "thisWeek";
  const requested = resolveRequestedBoard(query);
  try {
    const boards = await fetchAvailableBoards(userId);
    const board =
      boards.find(
        (candidate) =>
          requested !== undefined &&
          practiceBoardKey(candidate) === practiceBoardKey(requested),
      ) ?? boards[0];
    if (board === undefined) {
      return mobileJson<MobileRecordsResponse>({
        boards,
        current: [],
        previous: [],
      });
    }
    const now = new Date();
    const currentRange = getPeriodRange(period, now);
    const previousRange = getPreviousPeriodRange(period, now);
    const { current, previous } = await fetchChallengeAttempts(
      userId,
      board,
      currentRange.start,
      currentRange.end,
      previousRange.start,
      previousRange.end,
    );
    return mobileJson<MobileRecordsResponse>({
      boards,
      board,
      current: current,
      previous: previous,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/records",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * マイレコードの全履歴の 1 ページを返す（アプリ向け）
 * 全履歴API（アプリ向け）
 *
 * web の全履歴のページと同じ。クエリの `menu` / `variant` で土俵を絞り
 * （不正な値は絞り込みなし）、`page` でページを選ぶ（範囲外は最後の
 * ページに丸める）。
 */
export async function handleReadRecordResults(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileRecords");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const query = queryOf(request);
  const requestedPage = parsePageParam(query.page);
  try {
    const { items, totalPages } = await getChallengeResultsPaginated(
      auth.user.id,
      requestedPage,
      resolveRequestedBoard(query),
    );
    return mobileJson<MobileRecordResultsResponse>({
      items: items,
      page: Math.max(1, Math.min(requestedPage, totalPages || 1)),
      totalPages,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/records/results",
      "読み取りに失敗",
      error,
    );
  }
}
