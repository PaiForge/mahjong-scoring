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
 * 数える対象は {@link listTehaiHais} の列挙をそのまま使う。「手牌が使っている牌」の
 * 定義（副露を含める・槓子は 4 枚と数える）をこの関数が独自に持つと、列挙の側だけを
 * 直したときに枚数が黙って食い違う。
 *
 * @param tehai - 14枚の手牌
 * @param id - カウント対象の牌種ID
 */
export function countHaiInTehai(tehai: Tehai14, id: HaiKindId): number {
  return listTehaiHais(tehai).filter((h) => h === id).length;
}
