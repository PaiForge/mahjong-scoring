import { expect } from "vitest";
import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 牌の枚数上限の検証ヘルパー
 * 牌枚数検証
 *
 * 同じ牌種は 4 枚しか存在しない。手牌の中はブランド型の入口
 * （`validateTehai14`）が守るが、ドラ表示牌は手牌の外なので誰も見ていない。
 * 出題を「盤面に見えている牌の集合」として渡し、5 枚目が現れないことを見る。
 *
 * このモジュールはテスト専用。
 */
export function expectHaiUsageWithinLimit(
  hais: readonly HaiKindId[],
  label: string,
): void {
  const counts = new Map<HaiKindId, number>();
  for (const hai of hais) counts.set(hai, (counts.get(hai) ?? 0) + 1);

  for (const [kind, count] of counts) {
    expect(count, `${label}: 牌種 ${kind}`).toBeLessThanOrEqual(4);
  }
}
