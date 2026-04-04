import type { HaiKindId } from "@pai-forge/riichi-mahjong";
import { isHaiKindId } from "../../core/type-guards";

/**
 * ドラ表示牌をランダムに生成する
 * ドラ表示牌生成
 *
 * @param kantsuCount - 槓子の数（ドラ表示牌の数 = 1 + 槓子数）
 */
export function generateDoraMarkers(kantsuCount: number): HaiKindId[] {
  const count = 1 + kantsuCount;
  const markers: HaiKindId[] = [];
  for (let i = 0; i < count; i++) {
    const kindId = Math.floor(Math.random() * 34);
    if (isHaiKindId(kindId)) {
      markers.push(kindId);
    }
  }
  return markers;
}
