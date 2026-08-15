/**
 * 0以上1未満の乱数を返す
 * 乱数取得
 *
 * 乱数の入口をこのモジュールに一本化するための最下層ヘルパー。
 * 累積確率で分岐する等、{@link randomBool} で表せない用途にのみ使う。
 */
export function randomFloat(): number {
  return Math.random();
}

/**
 * 指定確率で true を返す
 * 確率抽選
 *
 * `Math.random() < p` を各所に直書きすると乱数の入口が散らばり、
 * 抽選が二重に走っていても気づけない。確率的な分岐はこの関数に寄せる。
 *
 * @param probability - true を返す確率（0〜1）
 */
export function randomBool(probability: number): boolean {
  return randomFloat() < probability;
}

/**
 * 指定範囲内のランダムな整数を取得
 * ランダム整数（乱数ユーティリティ）
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(randomFloat() * (max - min + 1)) + min;
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
