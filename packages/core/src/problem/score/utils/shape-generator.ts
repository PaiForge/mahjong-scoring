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
import { randomChoice } from "../../../core/random";
import { validateHaiKindId } from "../../../core/type-guards";
import type { HaiUsageTracker } from "../../../core/hai-tracker";

export { randomSimple, randomYaochu } from "../../shared/tile-random";

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

  const startValue = randomChoice(bases);
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
 */
export function generateKoutsu(
  tracker: HaiUsageTracker,
  furo: boolean = false,
): Koutsu | undefined {
  const hai = pickTrackableTile(tracker, 3);
  if (hai === undefined) return undefined;

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
  const hai = pickTrackableTile(tracker, 4);
  if (hai === undefined) return undefined;

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
export function generateToitsu(
  tracker: HaiUsageTracker,
): HaiKindId | undefined {
  return pickTrackableTile(tracker, 2);
}

/**
 * トラッカーで count 枚使用可能な牌をランダムに1つ選び、使用登録する
 * 使用可能牌の抽選
 *
 * 全34種から count 枚確保できる牌を収集し、ランダムに1つ選んで使用登録する。
 * 候補が無い、または使用登録に失敗した場合は undefined を返す。
 *
 * @param tracker - 牌使用状況トラッカー（成功時に count 枚使用登録する）
 * @param count - 必要枚数（刻子=3, 槓子=4, 対子=2）
 */
function pickTrackableTile(
  tracker: HaiUsageTracker,
  count: number,
): HaiKindId | undefined {
  const validHais: HaiKindId[] = [];
  for (let i = 0; i < 34; i++) {
    const result = validateHaiKindId(i);
    if (result.isOk() && tracker.canUse(result.value, count)) {
      validHais.push(result.value);
    }
  }

  if (validHais.length === 0) return undefined;

  const hai = randomChoice(validHais);
  if (tracker.use(hai, count).isErr()) return undefined;
  return hai;
}
