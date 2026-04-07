/**
 * LIKE/ILIKE パターンの特殊文字をエスケープする。
 * LIKE特殊文字エスケープ
 *
 * @param pattern - エスケープ対象の文字列
 */
export function escapeLikePattern(pattern: string): string {
  return pattern.replace(/[%_\\]/g, '\\$&');
}
