/**
 * PostgreSQL エラーコードを Error から抽出する。
 * Drizzle ORM は PostgresError を汎用 Error で wrap することがあるため、
 * `cause` チェーンも辿って検索する。
 *
 * PostgreSQLエラーコード抽出
 */

interface PgError extends Error {
  code: string;
}

function isPgError(err: unknown): err is PgError {
  return err instanceof Error && 'code' in err && typeof err.code === 'string';
}

export function extractPgErrorCode(err: unknown): string | undefined {
  if (!(err instanceof Error)) return undefined;

  if (isPgError(err)) return err.code;

  if (isPgError(err.cause)) return err.cause.code;

  return undefined;
}
