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
import type { MentsuWeights } from "../../shared/pick-mentsu-type";
import { pickAvailableHai } from "../../shared/tile-random";

/** 順子を構成する 3 枚（先頭から昇順） */
type ShuntsuHais = readonly [HaiKindId, HaiKindId, HaiKindId];

/**
 * 先頭の牌種から順子の 3 枚を組む（数牌の範囲を外れれば undefined）
 * 順子の牌組
 */
function shuntsuHaisFrom(start: number): ShuntsuHais | undefined {
  const first = validateHaiKindId(start);
  const second = validateHaiKindId(start + 1);
  const third = validateHaiKindId(start + 2);
  if (first.isErr() || second.isErr() || third.isErr()) return undefined;
  return [first.value, second.value, third.value];
}

/**
 * 3 枚とも残っている順子の先頭牌を列挙する（萬子・筒子・索子の 1〜7）
 * 順子候補列挙
 */
function listAvailableShuntsuStarts(tracker: HaiUsageTracker): HaiKindId[] {
  const starts: HaiKindId[] = [];
  for (const suitBase of SUIT_BASES) {
    for (let num = 0; num < 7; num++) {
      const hais = shuntsuHaisFrom(suitBase + num);
      if (hais && hais.every((hai) => tracker.canUse(hai))) {
        starts.push(hais[0]);
      }
    }
  }
  return starts;
}

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
  const starts = listAvailableShuntsuStarts(tracker);
  if (starts.length === 0) return undefined;

  const hais = shuntsuHaisFrom(randomChoice(starts, rng));
  if (!hais) return undefined;
  for (const hai of hais) {
    if (tracker.use(hai).isErr()) return undefined;
  }

  return furo
    ? {
        type: MentsuType.Shuntsu,
        hais,
        furo: { type: FuroType.Chi, from: Tacha.Kamicha, nakiHai: hais[0] },
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
          nakiHai: hai,
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
  if (!furo) return { type: MentsuType.Kantsu, hais };

  // 乱数は「種別 → 鳴き元」の順に引く（seed を固定したテストの出題を変えない）
  const isDaiminkan = randomBool(0.5, rng);
  const from = randomChoice([Tacha.Kamicha, Tacha.Toimen, Tacha.Shimocha], rng);
  return {
    type: MentsuType.Kantsu,
    hais,
    furo: isDaiminkan
      ? { type: FuroType.Daiminkan, from, nakiHai: hai }
      : { type: FuroType.Kakan, from, nakiHai: hai, kakanHai: hai },
  };
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
  const kind = pickMentsuType(weights, rng);
  switch (kind) {
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
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
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
