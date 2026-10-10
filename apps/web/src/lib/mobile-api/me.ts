import "server-only";

import type { NextResponse } from "next/server";

import type { MobileMeResponse } from "@mahjong-scoring/features/account/mobile-api";

import { logExternalError } from "../log-error";
import { getProfileCardByUserId } from "../db/queries";
import { authorizeMobileRequest } from "./auth";
import { mobileJson } from "./response";

/**
 * ログイン中のアカウントの状態をアプリに返す
 * アカウント状態API（アプリ向け）
 *
 * アプリは起動時とログイン直後にこれを読み、ログインが生きているか
 * （401 ならログアウト状態へ戻す）と、ユーザー名を決めたか（`profile`）を知る。
 *
 * アバターの URL はホームのヘッダーの飾りなので、読めなくても応答は失敗に
 * しない（ログインの生死とユーザー名の有無はアプリの導線を決めるため、
 * アバターの読み取りの失敗で巻き添えにしない）。
 */
export async function handleReadAccount(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileAccount");
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  if (!auth.profile)
    return mobileJson<MobileMeResponse>({ userId, profile: null });
  const avatarUrl = await readAvatarUrl(userId);
  return mobileJson<MobileMeResponse>({
    userId,
    profile: {
      username: auth.profile.username,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
  });
}

async function readAvatarUrl(userId: string): Promise<string | undefined> {
  try {
    const profile = await getProfileCardByUserId(userId);
    return profile?.avatarUrl ?? undefined;
  } catch (error) {
    logExternalError(
      "GET /api/mobile/v1/me",
      "アバターの読み取りに失敗",
      error,
    );
    return undefined;
  }
}
