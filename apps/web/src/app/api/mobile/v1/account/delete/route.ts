import type { MobileDeleteAccountResponse } from "@mahjong-scoring/features/account/mobile-api";

import { logActivityEvent } from "@/lib/activity-log";
import { logExternalError } from "@/lib/log-error";
import { authorizeMobileRequest } from "@/lib/mobile-api/auth";
import { mobileJson, mobilePreflight } from "@/lib/mobile-api/response";
import { requestAccountDeletion } from "@/lib/users/delete-account";

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
 * （`forAccountDeletion`）。受付そのものの失敗だけが 500 で、アプリは再試行を促す。
 */
export async function POST(request: Request) {
  const auth = await authorizeMobileRequest(request, "deleteAccount", {
    forAccountDeletion: true,
  });
  if (!auth.ok) return auth.response;

  let status: MobileDeleteAccountResponse["status"];
  try {
    status = await requestAccountDeletion(auth.user.id);
  } catch (error) {
    logExternalError("POST /api/mobile/v1/account/delete", "受付に失敗", error);
    return mobileJson({ error: "deleteFailed" }, { status: 500 });
  }

  logActivityEvent({
    userId: auth.user.id,
    action: "delete_account",
    targetType: "user",
    targetId: auth.user.id,
  });

  return mobileJson<MobileDeleteAccountResponse>({ status });
}

export const OPTIONS = mobilePreflight;
