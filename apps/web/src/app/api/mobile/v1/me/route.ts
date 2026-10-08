import type { MobileMeResponse } from "@mahjong-scoring/features/account/mobile-api";

import { authorizeMobileRequest } from "@/lib/mobile-api/auth";
import { mobileJson, mobilePreflight } from "@/lib/mobile-api/response";

/**
 * ログイン中のアカウントの状態をアプリに返す
 * アカウント状態API（アプリ向け）
 *
 * アプリは起動時とログイン直後にこれを読み、ログインが生きているか
 * （401 ならログアウト状態へ戻す）と、ユーザー名を決めたか（`profile`）を知る。
 */
export async function GET(request: Request) {
  const auth = await authorizeMobileRequest(request, "readMobileAccount");
  if (!auth.ok) return auth.response;

  return mobileJson<MobileMeResponse>({
    userId: auth.user.id,
    profile: auth.profile ?? null,
  });
}

export const OPTIONS = mobilePreflight;
