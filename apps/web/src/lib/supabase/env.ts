/** Supabase の公開環境変数 */
export interface SupabasePublicEnv {
  readonly url: string;
  readonly publishableKey: string;
}

/** Supabase Admin クライアント用の環境変数 */
export interface SupabaseAdminEnv {
  readonly url: string;
  readonly serviceRoleKey: string;
}

/**
 * Supabase の公開環境変数を取得する。未設定なら undefined。
 * Supabase公開環境変数読み取り
 *
 * 未設定を「例外」ではなく「値なし」として扱いたい呼び出し元
 * （proxy のセッション更新など、設定が無ければ黙ってスキップしたい箇所）向け。
 */
export function readSupabasePublicEnv(): SupabasePublicEnv | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) return undefined;
  return { url, publishableKey };
}

/**
 * Supabase の公開環境変数（URL / publishable key）を取得する。
 * 未設定の場合は例外をスローする。
 * Supabase公開環境変数取得
 *
 * `NEXT_PUBLIC_` 変数のためブラウザ／サーバー双方から参照できる。
 * client.ts / server.ts で共有する。
 */
export function getSupabasePublicEnv(): SupabasePublicEnv {
  const env = readSupabasePublicEnv();

  if (!env) {
    throw new Error(
      "Supabase environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return env;
}

/**
 * Supabase Admin クライアント用の環境変数を取得する。
 * 未設定の場合は例外をスローする。
 * SupabaseAdmin環境変数取得
 */
export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase admin environment variables are not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return { url, serviceRoleKey };
}
