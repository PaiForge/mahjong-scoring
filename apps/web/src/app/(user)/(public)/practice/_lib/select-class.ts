/**
 * select 要素の共通スタイルクラスを返す
 * セレクトボックス共通スタイル
 *
 * @param hasValue - 値が選択済みかどうか
 */
export function getSelectClass(hasValue: boolean): string {
  return `w-full rounded-lg border border-surface-300 bg-white px-2 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:bg-surface-100 ${
    hasValue ? "text-surface-900" : "text-surface-400"
  }`;
}
