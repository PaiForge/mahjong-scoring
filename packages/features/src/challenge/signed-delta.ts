/**
 * スコアの増減を符号付きで書く（`+2` / `−7` / `±0`）
 * 符号付き増減
 *
 * アプリ内の増減表示はすべてこの形に揃える。三角（▲ / ▼）でも百分率でもない
 * 理由:
 *
 * - チャレンジのスコアは正解数（数問〜数十問）で、百分率にすると 1 → 3 が
 *   「+200%」になり、前回が 0 なら百分率自体が定義できない
 * - 三角は「▼7」が失った量なのか値そのものなのかが読み取れない
 *
 * 符号付きなら、隣に並ぶ値に対する「前回より 2 問多い」としてそのまま読める。
 *
 * マイナスは U+2212（−）を使う。ハイフンマイナス（-）は数字の隣で細く見え、
 * プラスと幅も太さも揃わない。
 *
 * @param delta - 増減量（今回の値 − 比較対象の値）
 * @param fractionDigits - 表示する小数桁数。符号を決める前に丸めるため、
 *   小数第 1 位で出す 0.04 は `+0.0` ではなく `±0` になる
 */
export function formatSignedDelta(delta: number, fractionDigits = 0): string {
  const rounded = roundTo(delta, fractionDigits);
  if (rounded === 0) return "±0";
  const magnitude = Math.abs(rounded).toFixed(fractionDigits);
  return rounded > 0 ? `+${magnitude}` : `−${magnitude}`;
}

/**
 * 増減の向き
 * 増減トーン
 */
export type DeltaTone = "up" | "down" | "flat";

/**
 * 増減を色分けするための向きを返す
 * 増減トーン判定
 *
 * 丸めは {@link formatSignedDelta} と揃えてある。`±0` と表示された増減が
 * 色だけ「上向き」になることはない。
 */
export function signedDeltaTone(delta: number, fractionDigits = 0): DeltaTone {
  const rounded = roundTo(delta, fractionDigits);
  if (rounded === 0) return "flat";
  return rounded > 0 ? "up" : "down";
}

/**
 * 増減トーンごとの文字色
 * 増減トーン配色
 *
 * 結果画面の記録セクションとマイレコードの統計カードが共有する。増減の意味
 * （良くなった / 悪くなった / 変わらない）と色の対応を 1 箇所に置く。
 */
export const DELTA_TONE_CLASSES: Record<DeltaTone, string> = {
  up: "text-success",
  down: "text-destructive",
  flat: "text-surface-500",
};

function roundTo(value: number, fractionDigits: number): number {
  const factor = 10 ** fractionDigits;
  return Math.round(value * factor) / factor;
}
