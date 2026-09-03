import { mulberry32 } from "../core/random";
import type { RandomSource } from "../core/random";

/**
 * シード付きの決定論的な乱数供給源（テスト用）
 * 決定論的乱数
 *
 * 同じシードなら常に同じ数列を返すため、ジェネレータの出力を値として
 * 比較できる。本番の乱数（`Math.random`）を置き換えるためのものではない。
 *
 * @param seed - 数列を決めるシード
 */
export function seededRandom(seed: number): RandomSource {
  return mulberry32(seed);
}
