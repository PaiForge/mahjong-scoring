import type { RandomSource } from "../core/random";

/**
 * シード付きの決定論的な乱数供給源（テスト用）
 * 決定論的乱数
 *
 * mulberry32。同じシードなら常に同じ数列を返すため、ジェネレータの
 * 出力を値として比較できる。統計的な性質はテスト用途に足りればよく、
 * 本番の乱数（`Math.random`）を置き換えるためのものではない。
 *
 * @param seed - 数列を決めるシード
 */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
