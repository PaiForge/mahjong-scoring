import "server-only";

import type { NextResponse } from "next/server";

import {
  MOBILE_MYPAGE_ACTIVITY_DAYS,
  type MobileMypageErrorCode,
  type MobileMypageResponse,
} from "@mahjong-scoring/features/mypage/mobile-api";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import {
  getJstTodayDate,
  getRecentDays,
} from "@/app/(user)/(protected)/(confirmed)/mypage/(home)/_lib/heatmap-utils";
import { getExpHeatmapData } from "../db/get-exp-heatmap-data";
import { getProfileCardByUserId } from "../db/queries";
import { getUserRankSlugs } from "../db/rank-queries";

import { authorizeMobileRequest } from "./auth";
import { mobileJson, mobileServerError } from "./response";

/**
 * ユーザー名を決める前の要求への応答（409 `usernameRequired`）
 * ユーザー名未設定応答
 *
 * マイページ・マイレコードはユーザー名を決めた人のもの（web はこの段階で
 * 開かせず、ユーザー名の設定へ送る）。
 */
export function usernameRequired(): NextResponse {
  return mobileJson<{ error: MobileMypageErrorCode }>(
    { error: "usernameRequired" },
    { status: 409 },
  );
}

/**
 * マイページのトップの材料を返す（アプリ向け）
 * マイページAPI（アプリ向け）
 *
 * web のマイページのトップと同じ材料（プロフィールの見出し・最上位の
 * 段級位・経験値のアクティビティ）。アクティビティは web と同じキャッシュ
 * （`getExpHeatmapData`）から直近の日だけを切り出す — チャレンジの確定で
 * 捨てられるキャッシュを共有するので、記録の直後にも新しい値が出る。
 *
 * ユーザー名を決める前は 409 `usernameRequired`（web はこの段階で
 * マイページを開かせず、ユーザー名の設定へ送る）。
 */
export async function handleReadMypage(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileMypage");
  if (!auth.ok) return auth.response;
  if (!auth.profile) return usernameRequired();
  const userId = auth.user.id;
  try {
    const now = new Date();
    const [profile, heatmap, rankSlugs] = await Promise.all([
      getProfileCardByUserId(userId),
      getExpHeatmapData(userId, now),
      getUserRankSlugs(userId),
    ]);
    if (!profile?.username) return usernameRequired();
    const days = getRecentDays(
      getJstTodayDate(now),
      MOBILE_MYPAGE_ACTIVITY_DAYS,
    );
    return mobileJson<MobileMypageResponse>({
      profile: {
        username: profile.username,
        displayName: profile.displayName ?? undefined,
        avatarUrl: profile.avatarUrl ?? undefined,
      },
      rankSlug: highestRank(rankSlugs)?.slug,
      recentActivity: days.map((date) => ({
        date,
        exp: heatmap.daily[date] ?? 0,
        expByMenuType: heatmap.dailyByModule[date] ?? {},
      })),
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/mypage",
      "読み取りに失敗",
      error,
    );
  }
}
