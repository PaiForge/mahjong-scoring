import "server-only";

import type { NextResponse } from "next/server";

import {
  APPLE_APP_BUNDLE_ID,
  mobileAppleTokenRequestSchema,
  type MobileAppleTokenErrorCode,
} from "@mahjong-scoring/features/account/apple";

import { exchangeAppleAuthorizationCode } from "../apple/apple-id-api";
import { readAppleServerConfig } from "../apple/config";
import { saveAppleRefreshToken } from "../apple/refresh-tokens";
import { logExternalError } from "../log-error";

import { authorizeMobileRequest } from "./auth";
import { readMobileJson } from "./request";
import { mobileJson } from "./response";

const BODY_MAX_BYTES = 2 * 1024;

const ERROR_STATUS = {
  invalidRequest: 400,
  appleRejected: 422,
  appleUnavailable: 503,
} as const satisfies Record<MobileAppleTokenErrorCode, number>;

function appleTokenError(error: MobileAppleTokenErrorCode): NextResponse {
  return mobileJson({ error }, { status: ERROR_STATUS[error] });
}

/**
 * Apple の認可コードを Apple と交換し、refresh token を保存する（アプリ向け）
 * Apple認可コード受付API（アプリ向け）
 *
 * アプリは Apple でログインした直後に、Apple から受け取った認可コードを
 * ここへ送る。保存したトークンは退会のときに Apple 側の連携の取り消しに
 * 使う（`apple_refresh_tokens` の TSDoc）。
 *
 * 交換の結果の Apple のユーザー ID が、ログイン中のユーザーにつながった
 * Apple の連携と一致するときだけ保存する。別の Apple アカウントのコードを
 * 送って他人のトークンを紐づける経路を作らない。
 *
 * プロフィール未作成（ユーザー名を決める前）でも受け付ける — ログイン直後に呼ぶため。
 */
export async function handleSaveAppleToken(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "saveAppleToken");
  if (!auth.ok) return auth.response;
  const body = mobileAppleTokenRequestSchema.safeParse(
    await readMobileJson(request, BODY_MAX_BYTES),
  );
  if (!body.success) return appleTokenError("invalidRequest");
  if (!auth.appleSubject) return appleTokenError("appleRejected");

  const config = readAppleServerConfig();
  if (!config) {
    logExternalError(
      "POST /api/mobile/v1/apple/token",
      "Apple の設定（APPLE_*）が無い",
      undefined,
    );
    return appleTokenError("appleUnavailable");
  }

  const exchanged = await exchangeAppleAuthorizationCode(
    config,
    APPLE_APP_BUNDLE_ID,
    body.data.authorizationCode,
  );
  if (!exchanged.ok)
    return appleTokenError(
      exchanged.reason === "rejected" ? "appleRejected" : "appleUnavailable",
    );
  if (exchanged.subject !== auth.appleSubject)
    return appleTokenError("appleRejected");

  try {
    await saveAppleRefreshToken(auth.user.id, {
      appleSubject: exchanged.subject,
      clientId: APPLE_APP_BUNDLE_ID,
      refreshToken: exchanged.refreshToken,
      encryptionKey: config.encryptionKey,
    });
  } catch (error) {
    logExternalError("POST /api/mobile/v1/apple/token", "保存に失敗", error);
    return mobileJson({ error: "serverError" }, { status: 500 });
  }
  return mobileJson({ success: true });
}
