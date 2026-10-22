import { validateTehai14, type Tehai14 } from "@pai-forge/riichi-mahjong";

import { parseTehai } from "../problem/score/mpsz-serializer";

/**
 * MPSZ の 14 枚を和了形の手牌にする（テスト用）
 * 和了形手牌生成
 *
 * 固定の手牌を MPSZ で書くテストが使う。読めない・14 枚でない文字列は
 * テストの誤りなので投げる。
 */
export function agariTehai(mpsz: string): Tehai14 {
  const tehai = parseTehai(mpsz);
  if (tehai === undefined) throw new Error(mpsz);
  return validateTehai14(tehai)._unsafeUnwrap();
}
