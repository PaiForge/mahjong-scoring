import { createBrowserClient } from "@supabase/ssr";

/**
 * ブラウザ用 Supabase クライアントを生成する。
 * 環境変数が未設定の場合は例外をスローする。
 * ブラウザ用Supabaseクライアント生成
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
      "Supabase environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY."
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
