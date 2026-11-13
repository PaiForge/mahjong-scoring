import "server-only";

import type { NextResponse } from "next/server";

import {
  MOBILE_MYPAGE_ACTIVITY_DAYS,
  type MobileMypageResponse,
} from "@mahjong-scoring/features/mypage/mobile-api";
import { highestRank } from "@mahjong-scoring/features/ranks/registry";

import {
  getJstTodayDate,
  getRecentDays,
} from "@/app/[locale]/(user)/(protected)/(confirmed)/mypage/(home)/_lib/heatmap-utils";
import { getExpHeatmapData } from "../db/get-exp-heatmap-data";
import { getProfileCardByUserId } from "../db/queries";
import { getUserRankSlugs } from "../db/rank-queries";
import { countUnreadNotifications } from "../notifications/queries";

import { authorizeMobileRequest } from "./auth";
import {
  mobileJson,
  mobileServerError,
  mobileUsernameRequired,
} from "./response";

/**
 * マイページのトップの材料を返す（アプリ向け）
 * マイページAPI（アプリ向け）
 *
 * web のマイページのトップと同じ材料（プロフィールの見出し・最上位の
 * 段級位・経験値のアクティビティ）と、web のヘッダーのベルと同じ未読の
 * 通知の件数（アプリは iOS のマイページの「通知」の行に出す）。アクティビティは
 * web と同じキャッシュ（`getExpHeatmapData`）から直近の日だけを切り出す — チャレンジの確定で
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
  if (!auth.profile) return mobileUsernameRequired();
  const userId = auth.user.id;
  try {
    const now = new Date();
    const [profile, heatmap, rankSlugs, unreadNotificationCount] =
      await Promise.all([
        getProfileCardByUserId(userId),
        getExpHeatmapData(userId, now),
        getUserRankSlugs(userId),
        countUnreadNotifications(userId),
      ]);
    if (!profile?.username) return mobileUsernameRequired();
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
      unreadNotificationCount,
    });
  } catch (error) {
    return mobileServerError(
      "GET /api/mobile/v1/mypage",
      "読み取りに失敗",
      error,
    );
  }
}
