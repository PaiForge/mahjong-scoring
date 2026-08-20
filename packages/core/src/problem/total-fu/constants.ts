import type { Fu } from "@pai-forge/riichi-mahjong";

/**
 * 合計符の選択肢（符として取りうる値のすべて）
 * 合計符選択肢
 *
 * ライブラリの `Fu` 型（20 | 25 | 30 | … | 110）と同じ並び。
 * 型注釈を `readonly Fu[]` にしてあるため、`Fu` に値が増えても
 * ここが欠けていることは型では検出できない。並びの検証は
 * generator.test.ts が生成結果との突き合わせで担う。
 */
export const TOTAL_FU_OPTIONS: readonly Fu[] = [
  20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110,
];
