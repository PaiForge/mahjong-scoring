/** 手元の Supabase（`pnpm supabase start`）の API のポート */
const LOCAL_SUPABASE_PORT = 54321;

/**
 * 手元の Supabase の公開キー
 *
 * Supabase CLI がローカル環境に既定で振る値で、どの開発者の手元でも同じ。
 * 公開キー（publishable key）は本番でもアプリに埋め込む性質の値で、秘密ではない。
 */
const LOCAL_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";

/** アプリが使う Supabase の接続先 */
export interface SupabaseConfig {
  readonly url: string;
  readonly publishableKey: string;
}

/**
 * アプリが使う Supabase の接続先を決める
 * Supabase接続先解決
 *
 * 1. `EXPO_PUBLIC_SUPABASE_URL` と `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` があればそれ
 * 2. 開発中（Metro から読んだバンドル）なら手元の Supabase。実機からは
 *    localhost が端末自身を指すため、Metro のホスト（`hostUri`）のアドレスを使う
 *    （web の URL の決め方 `resolveSiteUrl` と同じ）
 * 3. それ以外（ストアのビルドで環境変数が無い）は undefined。ログインを出さない
 *
 * 本番の接続先を既定値として持たないのは、ストアのビルドに入れる値を
 * ビルドの設定（EAS の環境変数）だけで決めるため。
 */
export function resolveSupabaseConfig({
  envUrl,
  envKey,
  isDev,
  hostUri,
}: {
  readonly envUrl: string | undefined;
  readonly envKey: string | undefined;
  readonly isDev: boolean;
  readonly hostUri: string | undefined;
}): SupabaseConfig | undefined {
  if (envUrl && envKey) return { url: envUrl, publishableKey: envKey };
  if (!isDev) return undefined;
  const host = hostUri?.replace(/:\d+$/, "") || "localhost";
  return {
    url: envUrl || `http://${host}:${LOCAL_SUPABASE_PORT}`,
    publishableKey: envKey || LOCAL_SUPABASE_PUBLISHABLE_KEY,
  };
}
