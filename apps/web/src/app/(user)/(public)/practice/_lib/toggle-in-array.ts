/**
 * 配列内の値を出し入れする（チェックボックス群の複数選択用）
 * 配列トグル
 *
 * 含まれていれば除き、無ければ末尾に足す。出題条件のチェックボックスで
 * 「1つも選ばれていない」状態も許容するため、空配列を返しうる。
 */
export function toggleInArray<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((v) => v !== value)
    : [...values, value];
}
