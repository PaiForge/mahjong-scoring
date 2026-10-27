import { isAuthRetryableFetchError } from "@supabase/supabase-js";

/**
 * 認証サーバーが答えられなかった（トークンの正否が分からない）失敗か
 * 認証サーバー障害判定
 *
 * `getUser()` が user を返さなかったときの `error` を分ける。届かない
 * （`AuthRetryableFetchError`・status 0）・回数制限（429）・サーバーの障害
 * （5xx）は、トークンが無効だという答えではない。これを「未ログイン」に
 * 読み替えると、アプリは有効なログインを捨て、web の結果送信は記録を
 * 黙って捨てる。それ以外（不正な JWT の 403・ログアウト済みの
 * `AuthSessionMissingError`・削除済み）は認証サーバーが「無効」と答えたもの
 * （2026-10 にローカルで実測）。
 *
 * アプリ向け API の Bearer 検証（`lib/mobile-api/auth.ts`）と web の
 * cookie の検証（`lib/auth.ts`）が同じ基準で分ける。
 */
export function isAuthServiceFailure(error: unknown): boolean {
  if (isAuthRetryableFetchError(error)) return true;
  const status =
    typeof error === "object" && error !== null && "status" in error
      ? error.status
      : undefined;
  return (
    typeof status !== "number" ||
    status === 0 ||
    status === 429 ||
    status >= 500
  );
}
