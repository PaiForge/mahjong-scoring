import { logActivityEvent } from "@/lib/activity-log";
import { authorizeMobileRequest } from "@/lib/mobile-api/auth";
import { mobileJson, mobilePreflight } from "@/lib/mobile-api/response";
import { deleteAccount } from "@/lib/users/delete-account";

/**
 * アカウントを削除する（アプリ向け）
 * 退会API（アプリ向け）
 *
 * web の退会（`mypage/account/delete`）と同じ本体（`deleteAccount`）を呼ぶ。
 * 退会は途中で失敗しても同じ要求で最初からやり直せる作りなので、退会済みの
 * プロフィールも通す（`allowDeleted`）。プロフィール未作成のまま（ユーザー名を
 * 決める前）でも退会できる。失敗は 500 で、アプリは再試行を促す。
 */
export async function POST(request: Request) {
  const auth = await authorizeMobileRequest(request, "deleteAccount", {
    allowDeleted: true,
  });
  if (!auth.ok) return auth.response;

  const result = await deleteAccount(auth.user.id);
  if ("error" in result) {
    return mobileJson({ error: result.error }, { status: 500 });
  }

  logActivityEvent({
    userId: auth.user.id,
    action: "delete_account",
    targetType: "user",
    targetId: auth.user.id,
  });

  return mobileJson({ success: true });
}

export const OPTIONS = mobilePreflight;
