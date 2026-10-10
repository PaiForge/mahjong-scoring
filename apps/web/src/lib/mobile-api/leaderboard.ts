import "server-only";

import type { NextResponse } from "next/server";

import {
  isLeaderboardPeriod,
  resolveLeaderboardBoard,
} from "@mahjong-scoring/features/leaderboard/boards";
import type {
  MobileLeaderboardErrorCode,
  MobileLeaderboardRanksResponse,
  MobileLeaderboardResponse,
  MobileLeaderboardRow,
} from "@mahjong-scoring/features/leaderboard/mobile-api";

import { getBlockedUserIds, withoutBlocked } from "../blocks/blocks";
import type { RankedLeaderboardRow } from "../db/leaderboard-queries";
import { isHiddenFromLeaderboard } from "../db/leaderboard-visibility";
import {
  LEADERBOARD_PAGE_SIZE,
  getLeaderboard,
} from "../leaderboard/get-leaderboard";
import { getUserRanks } from "../leaderboard/user-ranks";
import { parsePageParam } from "../pagination";

import { authorizeMobileRequest, authorizeOptionalMobileRequest } from "./auth";
import { mobileJson, mobileServerError } from "./response";

/** 期間・土俵が無いときの 404 */
function notFound(): NextResponse {
  return mobileJson<{ error: MobileLeaderboardErrorCode }>(
    { error: "notFound" },
    { status: 404 },
  );
}

/**
 * ランキングの取得の失敗（500）。記録は `getLeaderboard` が済ませている
 */
function rankingFailed(): NextResponse {
  return mobileJson({ error: "serverError" }, { status: 500 });
}

/** ランキングの行を応答の形にする（内部の ID は出さない） */
function toMobileRow(
  row: RankedLeaderboardRow,
  viewerId: string | undefined,
): MobileLeaderboardRow {
  return {
    rank: row.rank,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    score: row.score,
    incorrectAnswers: row.incorrectAnswers,
    timeTaken: row.timeTaken,
    isViewer: row.userId === viewerId,
  };
}

/**
 * 本人の全土俵の順位を返す（アプリ向け）
 * ランキング順位API（アプリ向け）
 *
 * web のランキング一覧の「あなたの順位」の列と同じ材料。ゲストには順位が
 * 無いのでログインを要る。ランキングに表示しない設定のあいだは、順位の
 * 問い合わせ（土俵の数だけ ROW_NUMBER を回す）を投げずに空で返す。
 */
export async function handleReadLeaderboardRanks(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readLeaderboard");
  if (!auth.ok) return auth.response;
  const period = new URL(request.url).searchParams.get("period") ?? "";
  if (!isLeaderboardPeriod(period)) return notFound();
  try {
    const viewerHidden = await isHiddenFromLeaderboard(auth.user.id);
    const ranks = viewerHidden ? [] : await getUserRanks(auth.user.id, period);
    return mobileJson<MobileLeaderboardRanksResponse>({ ranks, viewerHidden });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/leaderboard/ranks",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * ある土俵・期間のランキングの 1 ページを返す（アプリ向け）
 * ランキング詳細API（アプリ向け）
 *
 * web の詳細ページと同じ材料・同じ並び。ゲストも読める。ログイン中なら
 * 本人の行に印を付け、ページ外の本人の順位を添え、ブロックした人の行を除く
 * （順位・件数は数え直さない）。範囲外のページは最後のページに丸める（お知らせと同じ）。
 *
 * @param period - URL の期間
 * @param slug - URL の練習の slug
 */
export async function handleReadLeaderboard(
  request: Request,
  period: string,
  slug: string,
): Promise<NextResponse> {
  const auth = await authorizeOptionalMobileRequest(request, "readLeaderboard");
  if (!auth.ok) return auth.response;
  const params = new URL(request.url).searchParams;
  const board = resolveLeaderboardBoard(
    slug,
    params.get("variant") ?? undefined,
  );
  if (!isLeaderboardPeriod(period) || board === undefined) return notFound();
  const requestedPage = parsePageParam(params.get("page") ?? undefined);
  const viewerId = auth.viewer?.user.id;

  try {
    const [viewerHidden, blockedIds] = await Promise.all([
      viewerId === undefined
        ? Promise.resolve(false)
        : isHiddenFromLeaderboard(viewerId),
      getBlockedUserIds(viewerId),
    ]);
    // 非表示中は母集団から外れているので本人の順位は引かない（web と同じ）
    const rankedViewerId = viewerHidden ? undefined : viewerId;

    const first = await getLeaderboard(
      board,
      period,
      requestedPage,
      rankedViewerId,
    );
    if (first === undefined) return rankingFailed();
    const totalPages = Math.ceil(first.totalCount / LEADERBOARD_PAGE_SIZE);
    const page = Math.max(1, Math.min(requestedPage, totalPages));
    const result =
      page === requestedPage
        ? first
        : await getLeaderboard(board, period, page, rankedViewerId);
    if (result === undefined) return rankingFailed();

    return mobileJson<MobileLeaderboardResponse>({
      rows: withoutBlocked(result.rows, blockedIds).map((row) =>
        toMobileRow(row, viewerId),
      ),
      page,
      totalPages,
      totalCount: result.totalCount,
      viewerRow:
        result.currentUserRank === undefined
          ? undefined
          : toMobileRow(result.currentUserRank, viewerId),
      viewerHidden,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/leaderboard/[period]/[module]",
      "読み取りに失敗",
      error,
    );
  }
}
