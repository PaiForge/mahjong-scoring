/**
 * Supabase の公開環境変数（URL / publishable key）を取得する。
 * 未設定の場合は例外をスローする。
 * Supabase公開環境変数取得
 *
 * `NEXT_PUBLIC_` 変数のためブラウザ／サーバー双方から参照できる。
 * client.ts / server.ts で共有する。
 */
export function getSupabasePublicEnv(): {
  readonly url: string;
  readonly publishableKey: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "Supabase environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return { url, publishableKey };
}
