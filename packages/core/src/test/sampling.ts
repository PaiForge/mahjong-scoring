import { expect } from "vitest";

/**
 * 確率的ジェネレータのテスト用ヘルパー
 * サンプリングヘルパー
 *
 * 出題ジェネレータは牌の残数不足などで `undefined` を返すことがあるため、
 * テストは「何回か試して生成できたものを検証する」形になる。その定型を
 * ここにまとめ、各テストは得られたサンプルへのアサーションだけを書く。
 *
 * このモジュールはテスト専用。
 */

/** 既定の試行回数 */
const DEFAULT_ATTEMPTS = 100;

/**
 * 試行して最初に生成できた1件を返す（生成できなければテストを失敗させる）
 * 単一サンプル取得
 */
export function generateOne<T>(
  generate: () => T | undefined,
  attempts = DEFAULT_ATTEMPTS,
): T {
  for (let i = 0; i < attempts; i++) {
    const value = generate();
    if (value) return value;
  }
  throw new Error(`${attempts} 回試行しても生成できなかった`);
}

/**
 * 「試行すれば生成できる」ことを検証する
 * 生成可能性検証
 */
export function expectGeneratesEventually<T>(
  generate: () => T | undefined,
  attempts = DEFAULT_ATTEMPTS,
): void {
  expect(() => generateOne(generate, attempts)).not.toThrow();
}

/**
 * 条件に合うサンプルを集める
 * サンプル収集
 *
 * 生成できなかった試行は読み飛ばす。`need` 件集まった時点で打ち切る。
 * 1件も集まらなければテストが意味を成さないため、呼び出し側で
 * 件数を検証すること（{@link expectSampled} を使うと簡潔）。
 *
 * @param generate - 出題ジェネレータ
 * @param options.need - 集めたい件数（既定 10）
 * @param options.attempts - 最大試行回数（既定 100）
 * @param options.where - 対象を絞る条件
 */
export function sample<T>(
  generate: () => T | undefined,
  options: {
    readonly need?: number;
    readonly attempts?: number;
    readonly where?: (value: T) => boolean;
  } = {},
): T[] {
  const { need = 10, attempts = DEFAULT_ATTEMPTS, where } = options;
  const collected: T[] = [];

  for (let i = 0; i < attempts && collected.length < need; i++) {
    const value = generate();
    if (!value) continue;
    if (where && !where(value)) continue;
    collected.push(value);
  }

  return collected;
}

/**
 * 条件に合うサンプルを集め、1件以上得られたことを保証して返す
 * サンプル収集（非空保証）
 */
export function expectSampled<T>(
  generate: () => T | undefined,
  options: Parameters<typeof sample<T>>[1] = {},
): T[] {
  const collected = sample(generate, options);
  expect(
    collected.length,
    "条件に合う問題が1件も生成されなかった",
  ).toBeGreaterThan(0);
  return collected;
}
