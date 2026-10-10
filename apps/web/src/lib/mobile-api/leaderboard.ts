import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import { isLeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import type {
  MobileLeaderboardErrorCode,
  MobileLeaderboardRanksResponse,
  MobileLeaderboardVisibility,
} from "@mahjong-scoring/features/leaderboard/mobile-api";

import { isHiddenFromLeaderboard } from "../db/leaderboard-visibility";
import { getUserRanks } from "../leaderboard/user-ranks";
import { saveLeaderboardVisibility } from "../users/leaderboard-visibility";

import { authorizeMobileRequest } from "./auth";
import { usernameRequired } from "./mypage";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

/** 設定の本文の上限。`{"hidden":false}` が収まれば足りる */
const VISIBILITY_BODY_MAX_BYTES = 256;

const visibilityBodySchema = z.object({ hidden: z.boolean() });

/** 期間が無いときの 404 */
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

/**
 * ランキングに表示しない設定を返す（アプリ向け）
 * ランキング非表示設定取得API（アプリ向け）
 *
 * web の設定のプライバシーの初期値と同じ値。ユーザー名を決める前は 409
 * `usernameRequired`（設定を書く `profiles` の行がまだ無い）。
 */
export async function handleReadLeaderboardVisibility(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readLeaderboard");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  try {
    const hidden = await isHiddenFromLeaderboard(auth.user.id);
    return mobileJson<MobileLeaderboardVisibility>({ hidden });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/leaderboard/visibility",
      "読み取りに失敗",
      error,
    );
  }
}

/**
 * ランキングに表示しない設定を保存する（アプリ向け）
 * ランキング非表示設定保存API（アプリ向け）
 *
 * web の設定のプライバシーと同じ本体（`saveLeaderboardVisibility`）を呼び、
 * 回数制限の枠も web と共有する。ユーザー名を決める前は 409
 * `usernameRequired`。
 */
export async function handleUpdateLeaderboardVisibility(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(
    request,
    "updateLeaderboardVisibility",
  );
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const body = await parseMobileBody(
    request,
    visibilityBodySchema,
    VISIBILITY_BODY_MAX_BYTES,
  );
  if (!body.ok) return body.response;
  try {
    const { written } = await saveLeaderboardVisibility(
      auth.user.id,
      body.data.hidden,
    );
    // 認証を通った後に退会が受け付けられた（入口で弾いたときと同じ答え）
    if (!written) return mobileJson({ error: "deleted" }, { status: 403 });
    return mobileJson({ success: true });
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/leaderboard/visibility",
      "保存に失敗",
      error,
    );
  }
}
