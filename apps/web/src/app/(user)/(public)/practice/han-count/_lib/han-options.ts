import { YAKUMAN_HAN } from "@mahjong-scoring/core";

/**
 * 翻数即答練習の選択肢（1翻〜役満）
 * 翻数選択肢
 *
 * 出題盤面と遊び方デモで同じ選択肢を出すため、両者からここを引く
 * （machi-fu の MACHI_FU_OPTIONS と同じ位置づけ）。
 */
export const HAN_OPTIONS: readonly number[] = Array.from(
  { length: YAKUMAN_HAN },
  (_, i) => i + 1,
);
