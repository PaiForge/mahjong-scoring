import "server-only";

import type { NextResponse } from "next/server";

import { isLeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import type {
  MobileLeaderboardErrorCode,
  MobileLeaderboardRanksResponse,
} from "@mahjong-scoring/features/leaderboard/mobile-api";

import { isHiddenFromLeaderboard } from "../db/leaderboard-visibility";
import { getUserRanks } from "../leaderboard/user-ranks";

import { authorizeMobileRequest } from "./auth";
import { mobileJson, mobileServerError } from "./response";

/** 期間・土俵が無いときの 404 */
function notFound(): NextResponse {
  return mobileJson<{ error: MobileLeaderboardErrorCode }>(
    { error: "notFound" },
    { status: 404 },
  );
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
