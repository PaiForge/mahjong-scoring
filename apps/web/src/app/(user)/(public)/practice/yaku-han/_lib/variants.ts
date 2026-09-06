import type { YakuHanRange } from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@/lib/db/practice-menu-types";

/**
 * 役翻数練習のバリアント → 出題範囲
 * 役翻数バリアント表
 *
 * バリアントの語彙はレジストリ（`variants`）、出題範囲の語彙は core の
 * `YakuHanRange`。両者を結ぶ唯一の表で、レジストリにバリアントを足すと
 * ここが埋まるまでコンパイルエラーになる。
 */
export const YAKU_HAN_VARIANT_RANGES: Readonly<
  Record<PracticeVariantOf<"yaku-han">, YakuHanRange>
> = {
  no_kuisagari: "no-kuisagari",
  kuisagari: "kuisagari",
  all: "all",
};
