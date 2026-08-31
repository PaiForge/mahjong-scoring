import {
  validateTehai14,
  type HaiKindId,
  type Tehai14,
} from "@pai-forge/riichi-mahjong";
import {
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../../core/random";
import { HaiUsageTracker } from "../../../core/hai-tracker";
import { generateToitsu } from "../utils/shape-generator";

/**
 * 七対子生成結果
 * 七対子生成結果
 */
export interface ChiitoiTehaiResult {
  readonly tehai: Tehai14;
  readonly agariHai: HaiKindId;
}

/**
 * 七対子をランダムに生成する
 * 七対子生成
 *
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateChiitoiTehai(
  rng: RandomSource = defaultRandomSource,
): ChiitoiTehaiResult | undefined {
  const tracker = new HaiUsageTracker();
  const closedHais: HaiKindId[] = [];

  // 7つの対子を生成
  for (let i = 0; i < 7; i++) {
    const hai = generateToitsu(tracker, rng);
    if (hai === undefined) return undefined;
    closedHais.push(hai, hai);
  }

  // 理牌
  closedHais.sort((a, b) => a - b);

  // 和了牌を決定
  const agariHai = randomChoice(closedHais, rng);

  const tehai = { closed: closedHais, exposed: [] as const };
  const result = validateTehai14(tehai);
  if (result.isErr()) return undefined;
  return { tehai: result.value, agariHai };
}
