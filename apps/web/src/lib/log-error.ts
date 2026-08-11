/**
 * 外部呼び出し失敗のログ出力
 * エラーログ
 *
 * DB / 認証 / Server Action など「失敗しても握り潰して既定値を返す」箇所の
 * ログ形式を揃えるための唯一の入口。unknown を安全に文字列化するため、
 * 各所で `error instanceof Error ? error.message : String(error)` を
 * 書き直さずに済む。
 */

/**
 * unknown を安全にメッセージ文字列へ変換する
 * エラーメッセージ抽出
 */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * 外部呼び出しの失敗を `[tag] message` 形式で記録する
 * 外部エラーログ
 *
 * @param tag - 発生箇所を示す短いタグ（例: "getLeaderboard"）
 * @param message - 何に失敗したかの説明
 * @param error - 捕捉した例外
 */
export function logExternalError(
  tag: string,
  message: string,
  error: unknown,
): void {
  console.error(`[${tag}] ${message}:`, toErrorMessage(error));
}
