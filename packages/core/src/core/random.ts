/**
 * 乱数の供給源（0以上1未満を返す）
 * 乱数供給源
 *
 * ジェネレータが乱数という副作用を直接持つと、生成結果を値として比較できない
 * （毎回違う問題が出る）。供給源をこの型で注入可能にし、既定値としてのみ
 * `Math.random` に触れる。問題 ID の採番を `core/id.ts` の `IdGenerator` で
 * 注入可能にしているのと同じ理由・同じ形。
 */
export type RandomSource = () => number;

/** 既定の乱数供給源（`Math.random`） */
export const defaultRandomSource: RandomSource = () => Math.random();

/**
 * 0以上1未満の乱数を返す
 * 乱数取得
 *
 * 乱数の入口をこのモジュールに一本化するための最下層ヘルパー。
 * 累積確率で分岐する等、{@link randomBool} で表せない用途にのみ使う。
 */
export function randomFloat(rng: RandomSource = defaultRandomSource): number {
  return rng();
}

/**
 * 指定確率で true を返す
 * 確率抽選
 *
 * `Math.random() < p` を各所に直書きすると乱数の入口が散らばり、
 * 抽選が二重に走っていても気づけない。確率的な分岐はこの関数に寄せる。
 *
 * @param probability - true を返す確率（0〜1）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomBool(
  probability: number,
  rng: RandomSource = defaultRandomSource,
): boolean {
  return randomFloat(rng) < probability;
}

/**
 * 指定範囲内のランダムな整数を取得
 * ランダム整数（乱数ユーティリティ）
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomInt(
  min: number,
  max: number,
  rng: RandomSource = defaultRandomSource,
): number {
  return Math.floor(randomFloat(rng) * (max - min + 1)) + min;
}

/**
 * 配列からランダムに1つ選択
 * ランダム選択
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function randomChoice<T>(
  arr: readonly T[],
  rng: RandomSource = defaultRandomSource,
): T {
  return arr[randomInt(0, arr.length - 1, rng)];
}

/**
 * 配列をシャッフル（Fisher-Yates）
 * シャッフル
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function shuffle<T>(
  arr: readonly T[],
  rng: RandomSource = defaultRandomSource,
): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, rng);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
