import type { YakuDetail } from "./types";

/**
 * 役の内訳の翻数の合計（ドラを含む。役満の上限には丸めない）
 * 翻数合計
 */
export function sumYakuHan(yakuDetails: readonly YakuDetail[]): number {
  return yakuDetails.reduce((sum, detail) => sum + detail.han, 0);
}
