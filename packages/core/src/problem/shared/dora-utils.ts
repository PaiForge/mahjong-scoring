import type { HaiKindId } from "@pai-forge/riichi-mahjong";
import { randomHaiKindId } from "./tile-random";
import { defaultRandomSource, type RandomSource } from "../../core/random";

/**
 * ドラ表示牌をランダムに生成する
 * ドラ表示牌生成
 *
 * @param kantsuCount - 槓子の数（ドラ表示牌の数 = 1 + 槓子数）
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateDoraMarkers(
  kantsuCount: number,
  rng: RandomSource = defaultRandomSource,
): HaiKindId[] {
  return Array.from({ length: 1 + kantsuCount }, () => randomHaiKindId(rng));
}
