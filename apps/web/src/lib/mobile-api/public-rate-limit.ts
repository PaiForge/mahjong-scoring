import "server-only";

import type { NextResponse } from "next/server";

import { getClientIp } from "../client-ip";
import { checkIpRateLimitGuard, IP_RATE_LIMITS } from "../rate-limit-ip";

import { mobileRateLimited } from "./response";

/**
 * 認証の無いアプリ向け API の IP の回数制限
 * 公開API回数制限（アプリ向け）
 *
 * 認証を通る API は `authorizeMobileRequest` が IP とユーザーの 2 段で数える。
 * 認証の無い API（販売中の商品・お知らせ・試験の合格ライン）には数える
 * ユーザーが居ないので IP の枠だけを掛ける。超えたら 429 `rateLimited` を返し、
 * 枠の内なら undefined。
 *
 * @param key - レートリミットのアクションキー（`IP_RATE_LIMITS` のキー）
 */
export async function limitPublicMobileRequest(
  key: keyof typeof IP_RATE_LIMITS,
): Promise<NextResponse | undefined> {
  return checkIpRateLimitGuard(await getClientIp(), key, IP_RATE_LIMITS[key])
    ? mobileRateLimited()
    : undefined;
}
