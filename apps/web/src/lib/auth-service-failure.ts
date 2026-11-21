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
 * cookie の検証（`lib/auth.ts` の `getUser()` と `getClaims()`、`proxy.ts`）が
 * 同じ基準で分ける。`getClaims()` では、期限切れのトークンのリフレッシュに
 * 失敗したとき（`AuthRetryableFetchError`）と、署名の検証に使う公開鍵
 * （JWKS）を取れなかったときがここに当たる。
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

/**
 * ログイン済みかどうかを確かめられなかったことを表す例外
 * 認証サーバー不通例外
 *
 * ページのガードと、未ログインなら別のページへ送る読み取りが投げる。
 * 「分からない」を「未ログイン」に読み替えて `/sign-in` や LP へ送ると、
 * ログイン済みの人が障害の間だけログアウトしたように見え、送られた先の
 * サインインも同じ障害で失敗する。投げればエラー境界（`error.tsx`）が受け、
 * 復旧後に「もう一度試す」で元の画面へ戻れる。
 *
 * Server Action は投げずに値で返す（`authenticateAndCheckBan` の
 * `serviceUnavailable`）。この例外は描画の経路だけで使う。
 */
export class AuthServiceUnavailableError extends Error {
  override readonly name = "AuthServiceUnavailableError";

  constructor() {
    super("The auth service could not verify the session");
  }
}

/**
 * 認証メールの送信頻度制限（GoTrue の max_frequency / 1 時間あたりの送信上限）に当たった失敗か
 * メール送信回数制限判定
 *
 * 確認メールの再送・メールアドレスの変更・パスワード設定のメールは、この制限に
 * 当たると「失敗」ではなく「しばらく待って」と案内する。HTTP の 429 か、
 * エラーコード `over_email_send_rate_limit` のどちらかで返る。
 */
export function isAuthEmailRateLimited(error: {
  readonly status?: number;
  readonly code?: string;
}): boolean {
  return error.status === 429 || error.code === "over_email_send_rate_limit";
}
