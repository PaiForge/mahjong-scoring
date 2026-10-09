import "server-only";

import type { NextResponse } from "next/server";

import {
  mobileAppleTokenRequestSchema,
  type MobileAppleTokenErrorCode,
} from "@mahjong-scoring/features/account/apple";

import {
  storeAppleAuthorizationCode,
  type AppleCodeStoreResult,
} from "../apple/refresh-tokens";

import { authorizeMobileRequest } from "./auth";
import { parseMobileBody } from "./request";
import { mobileJson, mobileServerError } from "./response";

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
 * 交換と保存は `storeAppleAuthorizationCode`（Apple のユーザー ID の突き合わせと、
 * 退会と競合したときの扱いはその TSDoc）。
 *
 * プロフィール未作成（ユーザー名を決める前）でも受け付ける — ログイン直後に呼ぶため。
 */
export async function handleSaveAppleToken(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "saveAppleToken");
  if (!auth.ok) return auth.response;
  const body = await parseMobileBody(
    request,
    mobileAppleTokenRequestSchema,
    BODY_MAX_BYTES,
  );
  if (!body.ok) return body.response;
  if (!auth.appleSubject) return appleTokenError("appleRejected");

  let stored: AppleCodeStoreResult;
  try {
    stored = await storeAppleAuthorizationCode(
      auth.user.id,
      auth.appleSubject,
      body.data.authorizationCode,
    );
  } catch (error) {
    return mobileServerError(
      "POST /api/mobile/v1/apple/token",
      "保存に失敗",
      error,
    );
  }
  if (stored === "rejected") return appleTokenError("appleRejected");
  if (stored === "unavailable") return appleTokenError("appleUnavailable");
  return mobileJson({ success: true });
}
