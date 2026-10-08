import "server-only";

import type { NextResponse } from "next/server";

import type { MobileMeResponse } from "@mahjong-scoring/features/account/mobile-api";

import { authorizeMobileRequest } from "./auth";
import { mobileJson } from "./response";

/**
 * ログイン中のアカウントの状態をアプリに返す
 * アカウント状態API（アプリ向け）
 *
 * アプリは起動時とログイン直後にこれを読み、ログインが生きているか
 * （401 ならログアウト状態へ戻す）と、ユーザー名を決めたか（`profile`）を知る。
 */
export async function handleReadAccount(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileAccount");
  if (!auth.ok) return auth.response;
  return mobileJson<MobileMeResponse>({
    userId: auth.user.id,
    profile: auth.profile ?? null,
  });
}
