type RegisterUsernameResult =
  | { success: true }
  | { success: false; error: string };

/**
 * ユーザー名登録APIを呼び出す。
 *
 * ユーザー名登録リクエスト
 */
export async function registerUsername(
  username: string,
  displayName?: string
): Promise<RegisterUsernameResult> {
  const res = await fetch('/api/username', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName }),
  });

  if (!res.ok) {
    const data = await res.json();
    return { success: false, error: data.error };
  }

  return { success: true };
}
