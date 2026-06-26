/**
 * 2つの文字列リストを集合として等価か判定する
 * 集合等価判定
 *
 * 重複は無視し、含まれる要素の種類が完全に一致する場合のみ true を返す。
 */
export function setsEqual(a: readonly string[], b: readonly string[]): boolean {
  const setA = new Set(a);
  const setB = new Set(b);

  if (setA.size !== setB.size) return false;

  for (const x of setA) {
    if (!setB.has(x)) return false;
  }

  return true;
}
