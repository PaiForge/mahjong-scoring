import "server-only";

import type { NextResponse } from "next/server";

import type { MobileBanResponse } from "@mahjong-scoring/features/account/mobile-api";

import { getLatestBanReason, isUserBanned } from "../ban";
import { authorizeMobileRequest } from "./auth";
import { mobileJson } from "./response";

/**
 * BAN の知らせをアプリに返す
 * BAN 通知API（アプリ向け）
 *
 * web の BAN のページ（`/banned`）と同じく、BAN 中の本人に理由を返す。他の
 * アプリ向け API は BAN 中を 403 で弾くので、ここだけ BAN 中も通す
 * （`forBanNotice`。退会処理中は他と同じく弾く）。BAN が解けていれば
 * `banned: false` を返し、アプリはアカウント状態を読み直す。
 */
export async function handleReadBan(request: Request): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "readMobileAccount", {
    forBanNotice: true,
  });
  if (!auth.ok) return auth.response;
  const userId = auth.user.id;
  if (!(await isUserBanned(userId)))
    return mobileJson<MobileBanResponse>({ banned: false });
  return mobileJson<MobileBanResponse>({
    banned: true,
    reason: await getLatestBanReason(userId),
  });
}
