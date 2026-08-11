import { callApi } from "@/lib/api-client";

type RegisterUsernameResult =
  { success: true } | { success: false; error: string };

/**
 * ユーザー名登録APIを呼び出す。
 *
 * ユーザー名登録リクエスト
 */
export async function registerUsername(
  username: string,
  displayName?: string,
): Promise<RegisterUsernameResult> {
  const result = await callApi("/api/username", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, displayName }),
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
