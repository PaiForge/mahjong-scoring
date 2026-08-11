/**
 * マイグレーション系スクリプトの DB 接続文字列解決
 * マイグレーション接続文字列
 *
 * `POSTGRES_URL_NON_POOLING` → `POSTGRES_URL` → `DATABASE_URL` の
 * フォールバック順の唯一の定義。マイグレーションは非プール接続を優先する
 * （プール接続では DDL のセッション状態が保てないため）。
 *
 * アプリ実行時の接続（`src/lib/db/index.ts`）は意図的にプール接続を使うため
 * ここには含めない。dotenv の読み込みは各エントリポイントの責務。
 */

/** ローカル Supabase の Postgres 接続文字列 */
export const LOCAL_SUPABASE_DATABASE_URL =
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

/**
 * マイグレーション用の接続文字列を解決する（未設定なら undefined）
 * 接続文字列解決
 */
export function resolveMigrationDatabaseUrl(): string | undefined {
  return (
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    undefined
  );
}
