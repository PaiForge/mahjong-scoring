import type { HaiKindId, Tehai14 } from "@pai-forge/riichi-mahjong";

/**
 * 手牌が使っている牌をすべて列挙する（副露・槓子を含む）
 * 使用牌の列挙
 *
 * 槓子は 4 枚とも返す。山に残っている牌を知りたい側（ドラ表示牌の抽選）が
 * 「この手で何が何枚使われたか」を数えるための入口。
 *
 * @param tehai - 14枚の手牌
 */
export function listTehaiHais(tehai: Tehai14): HaiKindId[] {
  return [...tehai.closed, ...tehai.exposed.flatMap((m) => [...m.hais])];
}

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
