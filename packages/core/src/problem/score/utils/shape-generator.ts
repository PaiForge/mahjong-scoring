import {
  MentsuType,
  FuroType,
  Tacha,
  type CompletedMentsu,
  type HaiKindId,
  type Shuntsu,
  type Koutsu,
  type Kantsu,
} from "@pai-forge/riichi-mahjong";
import { SUIT_BASES } from "../../../core/constants";
import { pickMentsuType } from "../../shared/pick-mentsu-type";
import {
  randomBool,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../../core/random";
import { validateHaiKindId } from "../../../core/type-guards";
import type { HaiUsageTracker } from "../../../core/hai-tracker";
import type { MentsuWeights } from "../../mentsu-fu/mentsu-factory";
import { pickAvailableHai } from "../../shared/tile-random";

/**
 * 順子を生成する（数牌のみ）
 * 順子生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param furo - 副露（チー）として生成するかどうか
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateShuntsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
  rng: RandomSource = defaultRandomSource,
): Shuntsu | undefined {
  const bases: number[] = [];

  for (const suitBase of SUIT_BASES) {
    for (let num = 0; num < 7; num++) {
      const start = suitBase + num;
      const h2 = start + 1;
      const h3 = start + 2;

      const startResult = validateHaiKindId(start);
      const h2Result = validateHaiKindId(h2);
      const h3Result = validateHaiKindId(h3);

      if (
        startResult.isOk() &&
        h2Result.isOk() &&
        h3Result.isOk() &&
        tracker.canUse(startResult.value) &&
        tracker.canUse(h2Result.value) &&
        tracker.canUse(h3Result.value)
      ) {
        bases.push(start);
      }
    }
  }

  if (bases.length === 0) return undefined;

  const startValue = randomChoice(bases, rng);
  const startResult = validateHaiKindId(startValue);
  const h2Result = validateHaiKindId(startValue + 1);
  const h3Result = validateHaiKindId(startValue + 2);

  if (startResult.isErr() || h2Result.isErr() || h3Result.isErr())
    return undefined;

  const start = startResult.value;
  const h2 = h2Result.value;
  const h3 = h3Result.value;

  if (tracker.use(start).isErr()) return undefined;
  if (tracker.use(h2).isErr()) return undefined;
  if (tracker.use(h3).isErr()) return undefined;

  const hais = [start, h2, h3] as const;
  return furo
    ? {
        type: MentsuType.Shuntsu,
        hais,
        furo: { type: FuroType.Chi, from: Tacha.Kamicha },
      }
    : { type: MentsuType.Shuntsu, hais };
}

/**
 * 刻子を生成する
 * 刻子生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param furo - 副露（ポン）として生成するかどうか
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateKoutsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
  rng: RandomSource = defaultRandomSource,
): Koutsu | undefined {
  const hai = pickAvailableHai(tracker, 3, rng);
  if (hai === undefined) return undefined;

  const hais = [hai, hai, hai] as const;
  return furo
    ? {
        type: MentsuType.Koutsu,
        hais,
        furo: {
          type: FuroType.Pon,
          from: randomChoice(
            [Tacha.Kamicha, Tacha.Toimen, Tacha.Shimocha],
            rng,
          ),
        },
      }
    : { type: MentsuType.Koutsu, hais };
}

/**
 * 槓子を生成する
 * 槓子生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param furo - 副露（大明槓）として生成するかどうか
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateKantsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
  rng: RandomSource = defaultRandomSource,
): Kantsu | undefined {
  const hai = pickAvailableHai(tracker, 4, rng);
  if (hai === undefined) return undefined;

  const hais = [hai, hai, hai, hai] as const;
  return furo
    ? {
        type: MentsuType.Kantsu,
        hais,
        furo: {
          type: randomBool(0.5, rng) ? FuroType.Daiminkan : FuroType.Kakan,
          from: randomChoice(
            [Tacha.Kamicha, Tacha.Toimen, Tacha.Shimocha],
            rng,
          ),
        },
      }
    : { type: MentsuType.Kantsu, hais };
}

/**
 * 重み付きでランダムな面子を生成する（トラッカー対応）
 * 重み付き面子生成
 *
 * 選ばれた種別が牌の残数不足で生成できない場合は、
 * 他の種別へフォールバックして可能な限り面子を返す。
 *
 * @param tracker - 牌使用状況トラッカー
 * @param weights - 面子種別の確率重み
 * @param furo - 副露として生成するかどうか
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateWeightedMentsu(
  tracker: HaiUsageTracker,
  weights: Readonly<MentsuWeights>,
  furo: boolean = false,
  rng: RandomSource = defaultRandomSource,
): CompletedMentsu | undefined {
  switch (pickMentsuType(weights, rng)) {
    case "shuntsu":
      return (
        generateShuntsu(tracker, furo, rng) ??
        generateKoutsu(tracker, furo, rng)
      );
    case "koutsu":
      return (
        generateKoutsu(tracker, furo, rng) ??
        generateShuntsu(tracker, furo, rng)
      );
    case "kantsu":
      return (
        generateKantsu(tracker, furo, rng) ??
        generateKoutsu(tracker, furo, rng) ??
        generateShuntsu(tracker, furo, rng)
      );
  }
}

/**
 * 対子（雀頭）を生成する
 * 雀頭生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param rng - 乱数供給源（既定 `Math.random`）
 */
export function generateToitsu(
  tracker: HaiUsageTracker,
  rng: RandomSource = defaultRandomSource,
): HaiKindId | undefined {
  return pickAvailableHai(tracker, 2, rng);
}
