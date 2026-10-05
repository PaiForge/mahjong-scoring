/**
 * 点数を日本語ロケールの桁区切りで表示する
 * 点数表示
 *
 * @param points 点数
 */
export function formatPoints(points: number): string {
  return points.toLocaleString("ja-JP");
}
