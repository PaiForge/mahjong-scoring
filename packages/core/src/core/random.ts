/**
 * 指定範囲内のランダムな整数を取得
 * ランダム整数（乱数ユーティリティ）
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 配列からランダムに1つ選択
 * ランダム選択
 */
export function randomChoice<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * 配列をシャッフル（Fisher-Yates）
 * シャッフル
 */
export function shuffle<T>(arr: readonly T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
