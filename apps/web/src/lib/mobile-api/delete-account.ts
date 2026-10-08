import "server-only";

import type { NextResponse } from "next/server";
import { z } from "zod";

import type {
  MobileDeleteAccountErrorCode,
  MobileDeleteAccountResponse,
} from "@mahjong-scoring/features/account/mobile-api";

import { logActivityEvent } from "../activity-log";
import {
  hasAppleRefreshToken,
  storeAppleAuthorizationCode,
} from "../apple/refresh-tokens";
import { logExternalError } from "../log-error";
import { requestAccountDeletion } from "../users/delete-account";

import { authorizeMobileRequest } from "./auth";
import { readMobileJson } from "./request";
import { mobileJson } from "./response";

const BODY_MAX_BYTES = 2 * 1024;

const bodySchema = z.object({
  appleAuthorizationCode: z.string().min(1).max(1024).optional(),
});

const ERROR_STATUS = {
  appleAuthorizationRequired: 409,
  appleRejected: 422,
  appleUnavailable: 503,
  deleteFailed: 500,
} as const satisfies Record<MobileDeleteAccountErrorCode, number>;

function deleteError(error: MobileDeleteAccountErrorCode): NextResponse {
  return mobileJson({ error }, { status: ERROR_STATUS[error] });
}

/**
 * アカウントの退会を受け付ける（アプリ向け）
 * 退会API（アプリ向け）
 *
 * web の退会と同じ受付（`requestAccountDeletion`）を呼ぶ。受け付けた後の
 * 工程はサーバーが最後まで進めるので、応答の `status` が `pending` でも
 * アプリはやり直さなくてよい。受付は冪等で、応答を失って送り直しても
 * 二重に処理しない。
 *
 * BAN 中・退会処理中・プロフィール未作成（ユーザー名を決める前）でも受け付ける
 * （`forAccountDeletion`）。
 *
 * @design Apple の取り消し用トークンが無ければ、受け付ける前に確保する
 * 退会では Apple 側の連携も取り消す（Apple の TN3194）。そのトークンは
 * Apple でログインした直後にアプリが預けるが、通信の失敗などで預かれて
 * いないことがある。そのまま受け付けると取り消せずに終わるので、Apple の
 * 連携があってトークンが無いときは 409 `appleAuthorizationRequired` で断り、
 * アプリが Apple で確認し直して得た認可コードを付けて送り直す。コードは
 * 受付の前に交換して保存する（交換に失敗したら受け付けない）。
 */
export async function handleDeleteAccount(
  request: Request,
): Promise<NextResponse> {
  const auth = await authorizeMobileRequest(request, "deleteAccount", {
    forAccountDeletion: true,
  });
  if (!auth.ok) return auth.response;
  // 本文は省略できる（Apple の連携が無い・トークンを持っているとき）
  const body = bodySchema.safeParse(
    (await readMobileJson(request, BODY_MAX_BYTES)) ?? {},
  );
  if (!body.success)
    return mobileJson({ error: "invalidRequest" }, { status: 400 });
  const userId = auth.user.id;

  try {
    const code = body.data.appleAuthorizationCode;
    if (code !== undefined) {
      if (!auth.appleSubject) return deleteError("appleRejected");
      const stored = await storeAppleAuthorizationCode(
        userId,
        auth.appleSubject,
        code,
      );
      if (stored === "rejected") return deleteError("appleRejected");
      if (stored === "unavailable") return deleteError("appleUnavailable");
    } else if (auth.appleSubject && !(await hasAppleRefreshToken(userId))) {
      return deleteError("appleAuthorizationRequired");
    }
  } catch (error) {
    logExternalError(
      "POST /api/mobile/v1/account/delete",
      "Apple のトークンの確保に失敗",
      error,
    );
    return deleteError("deleteFailed");
  }

  let status: MobileDeleteAccountResponse["status"];
  try {
    status = await requestAccountDeletion(userId);
  } catch (error) {
    logExternalError("POST /api/mobile/v1/account/delete", "受付に失敗", error);
    return deleteError("deleteFailed");
  }

  logActivityEvent({
    userId,
    action: "delete_account",
    targetType: "user",
    targetId: userId,
  });

  return mobileJson<MobileDeleteAccountResponse>({ status });
}
