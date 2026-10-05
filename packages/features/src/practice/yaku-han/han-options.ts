import { YAKUMAN_HAN } from "@mahjong-scoring/core";

/**
 * 役翻数練習の選択肢（1〜6翻 + 役満）
 * 役翻数選択肢
 *
 * 出題盤面の回答フォームと問題別一覧で同じ選択肢・同じ表記を使うため、
 * web とモバイルの両方からここを引く（翻数即答の `han-count/han-options` と
 * 同じ位置づけ）。
 */
export const HAN_OPTIONS = [1, 2, 3, 4, 5, 6, YAKUMAN_HAN] as const;

/**
 * 翻数が役満か（役満は「13翻」ではなく専用表記にする）
 * 役満判定
 */
export function isYakuman(han: number): boolean {
  return han === YAKUMAN_HAN;
}
