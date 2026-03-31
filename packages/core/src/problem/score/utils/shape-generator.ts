import {
  HaiKind,
  MentsuType,
  FuroType,
  Tacha,
  type HaiKindId,
  type Shuntsu,
  type Koutsu,
  type Kantsu,
} from "@pai-forge/riichi-mahjong";
import { randomInt, randomChoice } from "../../../core/random";
import { validateHaiKindId } from "../../../core/type-guards";
import type { HaiUsageTracker } from "../../../core/hai-tracker";

/**
 * 字牌と三元牌の配列（ランダム選択用）
 * 字牌・三元牌リスト
 */
const JIHAI_AND_SANGENHAI: readonly HaiKindId[] = [
  HaiKind.Ton, HaiKind.Nan, HaiKind.Sha, HaiKind.Pei,
  HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun,
];

/**
 * 么九牌（数牌の1,9）の配列
 * 端牌リスト
 */
const TERMINALS: readonly HaiKindId[] = [
  HaiKind.ManZu1, HaiKind.ManZu9,
  HaiKind.PinZu1, HaiKind.PinZu9,
  HaiKind.SouZu1, HaiKind.SouZu9,
];

/**
 * ランダムな中張牌（2〜8）を生成する
 * 中張牌生成
 */
export function randomSimple(): HaiKindId {
  const suit = randomChoice(["m", "p", "s"]);
  const num = randomInt(2, 8);
  let base: HaiKindId = HaiKind.ManZu1;
  if (suit === "p") base = HaiKind.PinZu1;
  if (suit === "s") base = HaiKind.SouZu1;
  return validateHaiKindId(base + num - 1).unwrapOr(HaiKind.ManZu5);
}

/**
 * ランダムな么九牌（1,9,字牌）を生成する
 * 么九牌生成
 */
export function randomYaochu(): HaiKindId {
  const isHonor = Math.random() < 0.5;
  if (isHonor) return randomChoice(JIHAI_AND_SANGENHAI);
  return randomChoice(TERMINALS);
}

/**
 * 順子を生成する（数牌のみ）
 * 順子生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param furo - 副露（チー）として生成するかどうか
 */
export function generateShuntsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
): Shuntsu | undefined {
  const suits = [HaiKind.ManZu1, HaiKind.PinZu1, HaiKind.SouZu1];
  const bases: number[] = [];

  for (const suitBase of suits) {
    for (let num = 0; num < 7; num++) {
      const start = suitBase + num;
      const h2 = start + 1;
      const h3 = start + 2;

      const startResult = validateHaiKindId(start);
      const h2Result = validateHaiKindId(h2);
      const h3Result = validateHaiKindId(h3);

      if (
        startResult.isOk() && h2Result.isOk() && h3Result.isOk() &&
        tracker.canUse(startResult.value) &&
        tracker.canUse(h2Result.value) &&
        tracker.canUse(h3Result.value)
      ) {
        bases.push(start);
      }
    }
  }

  if (bases.length === 0) return undefined;

  const startValue = randomChoice(bases);
  const startResult = validateHaiKindId(startValue);
  const h2Result = validateHaiKindId(startValue + 1);
  const h3Result = validateHaiKindId(startValue + 2);

  if (startResult.isErr() || h2Result.isErr() || h3Result.isErr()) return undefined;

  const start = startResult.value;
  const h2 = h2Result.value;
  const h3 = h3Result.value;

  if (tracker.use(start).isErr()) return undefined;
  if (tracker.use(h2).isErr()) return undefined;
  if (tracker.use(h3).isErr()) return undefined;

  const hais = [start, h2, h3] as const;
  return furo
    ? { type: MentsuType.Shuntsu, hais, furo: { type: FuroType.Chi, from: Tacha.Kamicha } }
    : { type: MentsuType.Shuntsu, hais };
}

/**
 * 刻子を生成する
 * 刻子生成
 *
 * @param tracker - 牌使用状況トラッカー
 * @param furo - 副露（ポン）として生成するかどうか
 */
export function generateKoutsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
): Koutsu | undefined {
  const validHais: HaiKindId[] = [];
  for (let i = 0; i < 34; i++) {
    const result = validateHaiKindId(i);
    if (result.isOk() && tracker.canUse(result.value, 3)) {
      validHais.push(result.value);
    }
  }

  if (validHais.length === 0) return undefined;

  const hai = randomChoice(validHais);
  if (tracker.use(hai, 3).isErr()) return undefined;

  const hais = [hai, hai, hai] as const;
  return furo
    ? {
        type: MentsuType.Koutsu,
        hais,
        furo: {
          type: FuroType.Pon,
          from: randomChoice([Tacha.Kamicha, Tacha.Toimen, Tacha.Shimocha]),
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
 */
export function generateKantsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
): Kantsu | undefined {
  const validHais: HaiKindId[] = [];
  for (let i = 0; i < 34; i++) {
    const result = validateHaiKindId(i);
    if (result.isOk() && tracker.canUse(result.value, 4)) {
      validHais.push(result.value);
    }
  }

  if (validHais.length === 0) return undefined;

  const hai = randomChoice(validHais);
  if (tracker.use(hai, 4).isErr()) return undefined;

  const hais = [hai, hai, hai, hai] as const;
  return furo
    ? {
        type: MentsuType.Kantsu,
        hais,
        furo: {
          type: Math.random() < 0.5 ? FuroType.Daiminkan : FuroType.Kakan,
          from: randomChoice([Tacha.Kamicha, Tacha.Toimen, Tacha.Shimocha]),
        },
      }
    : { type: MentsuType.Kantsu, hais };
}

/**
 * 対子（雀頭）を生成する
 * 雀頭生成
 *
 * @param tracker - 牌使用状況トラッカー
 */
export function generateToitsu(tracker: HaiUsageTracker): HaiKindId | undefined {
  const validHais: HaiKindId[] = [];
  for (let i = 0; i < 34; i++) {
    const result = validateHaiKindId(i);
    if (result.isOk() && tracker.canUse(result.value, 2)) {
      validHais.push(result.value);
    }
  }

  if (validHais.length === 0) return undefined;

  const hai = randomChoice(validHais);
  if (tracker.use(hai, 2).isErr()) return undefined;
  return hai;
}
