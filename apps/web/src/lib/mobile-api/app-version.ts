import "server-only";

import type { NextResponse } from "next/server";

import {
  isMobileAppPlatform,
  type MobileAppPlatform,
  type MobileAppVersionResponse,
} from "@mahjong-scoring/features/app-version/mobile-api";
import { parseAppVersion } from "@mahjong-scoring/features/app-version/version";

import { limitPublicMobileRequest } from "./public-rate-limit";
import { mobileInvalidRequest, mobileJson } from "./response";

/**
 * OS ごとの最低バージョンを持つ環境変数名
 * 最低バージョン環境変数名
 *
 * 値は `1.1.0` の形。空・未設定・形の違う値は「止めない」として扱う —
 * 設定の誤りで全員を締め出さないため。止めたい版が出たときだけ入れる。
 */
const MINIMUM_VERSION_ENV_NAMES: Readonly<Record<MobileAppPlatform, string>> = {
  ios: "MOBILE_MINIMUM_APP_VERSION_IOS",
  android: "MOBILE_MINIMUM_APP_VERSION_ANDROID",
};

/**
 * アプリの最低バージョンを返す（アプリ向け）
 * 最低バージョンAPI（アプリ向け）
 *
 * アプリは自分の版がこれを下回ればアップデートの案内だけを出す。誰が読んでも
 * 同じ値なのでログインを要らない。認証が無いので IP の回数だけを絞る。
 * OS の指定が無い・知らない値なら 400 `invalidRequest`。
 */
export async function handleReadAppVersion(
  request: Request,
): Promise<NextResponse> {
  const rateLimited = await limitPublicMobileRequest("readMobileAppVersion");
  if (rateLimited) return rateLimited;
  const platform = new URL(request.url).searchParams.get("platform");
  if (!isMobileAppPlatform(platform)) return mobileInvalidRequest();
  const minimumVersion = process.env[MINIMUM_VERSION_ENV_NAMES[platform]];
  return mobileJson<MobileAppVersionResponse>(
    minimumVersion !== undefined && parseAppVersion(minimumVersion)
      ? { minimumVersion }
      : {},
  );
}
