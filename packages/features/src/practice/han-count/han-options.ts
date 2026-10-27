import { YAKUMAN_HAN } from "@mahjong-scoring/core";

/**
 * 翻数即答練習の選択肢（1翻〜役満の全段）
 * 翻数選択肢
 *
 * 出題盤面と遊び方デモで同じ選択肢を出すため、両者からここを引く
 * （machi-fu の `MACHI_FU_OPTIONS` と同じ位置づけ）。手全体の合計翻数を答えるので
 * 1 翻から役満まで 1 段ずつ並べる。役翻数練習の `YAKU_HAN_OPTIONS` と値域が違う理由は
 * そちらの TSDoc にある。
 */
export const HAN_COUNT_OPTIONS: readonly number[] = Array.from(
  { length: YAKUMAN_HAN },
  (_, i) => i + 1,
);
