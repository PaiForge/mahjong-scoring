/**
 * 数値を昇順に比べる（`Array.prototype.sort` にそのまま渡せる）
 * 数値比較
 *
 * 要素どうしを引き算するだけの比較関数（`(a, b) => a - b`）は ESLint で
 * 禁じている。牌種 ID も数値なので、牌を数値として並べる書き方と見分けが
 * 付かないため。牌は riichi-mahjong の `sortHaiCodes` / `compareHaiCode`
 * （理牌の順）で、符・翻・点数などの数値はこれで並べ、何を並べているかを
 * 呼び出し側に残す。
 */
export function compareNumbers(a: number, b: number): number {
  return a - b;
}
