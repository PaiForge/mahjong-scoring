/**
 * 割合を四捨五入した整数のパーセントにする
 * 整数パーセント
 *
 * 正答率・学習の進み具合のように「n%」と見せる値に使う。全体が 0 件なら 0%。
 * このモジュールは純粋。
 *
 * @param part - 部分の件数
 * @param total - 全体の件数
 */
export function roundedPercent(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}
