import type { HaiKindId, Tehai14 } from "@pai-forge/riichi-mahjong";

/**
 * 手牌中の指定牌種の枚数をカウントする
 * 牌枚数カウント
 *
 * @param tehai - 14枚の手牌
 * @param id - カウント対象の牌種ID
 */
export function countHaiInTehai(tehai: Tehai14, id: HaiKindId): number {
  let count = 0;
  for (const h of tehai.closed) {
    if (h === id) count++;
  }
  for (const m of tehai.exposed) {
    for (const h of m.hais) {
      if (h === id) count++;
    }
  }
  return count;
}
