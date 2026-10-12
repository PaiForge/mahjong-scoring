import type { TotalFuRange } from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@mahjong-scoring/features/practice-menu-types";

/**
 * 合計符練習のバリアント → 出題範囲
 * 合計符バリアント表
 *
 * バリアントの語彙はレジストリ（`variants`）、出題範囲の語彙は core の
 * `TotalFuRange`。両者を結ぶ唯一の表で、レジストリにバリアントを足すと
 * ここが埋まるまでコンパイルエラーになる。
 */
export const TOTAL_FU_VARIANT_RANGES: Readonly<
  Record<PracticeVariantOf<"total-fu">, TotalFuRange>
> = {
  up_to_40: "up-to-40",
  up_to_60: "up-to-60",
  all: "all",
};
