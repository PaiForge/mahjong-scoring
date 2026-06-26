import { MentsuType } from "@pai-forge/riichi-mahjong";

/**
 * 手牌中の槓子数をカウントする
 * 槓子数カウント
 *
 * ドラ表示牌の枚数（= 1 + 槓子数）算出などに用いる。
 */
export function countKantsu(tehai: {
  readonly exposed: readonly { readonly type: string }[];
}): number {
  return tehai.exposed.filter((m) => m.type === MentsuType.Kantsu).length;
}
