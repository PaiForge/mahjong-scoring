import {
  MentsuType,
  FuroType,
  Tacha,
  type Shuntsu,
  type Koutsu,
  type Kantsu,
} from "@pai-forge/riichi-mahjong";
import { openLabel, yaochuLabel } from "../shared/mentsu-labels";
import { pickMentsuType } from "../shared/pick-mentsu-type";
import { SUIT_BASES } from "../../core/constants";
import { randomInt, randomChoice } from "../../core/random";
import { calculateMentsuFu } from "../../core/score-calculation";
import { isHaiKindId } from "../../core/type-guards";
import { randomSimple, randomYaochu } from "../shared/tile-random";

/**
 * 面子生成結果
 * 面子生成結果
 */
export interface MentsuResult {
  readonly mentsu: Shuntsu | Koutsu | Kantsu;
  readonly fu: number;
  readonly explanation: string;
}

/**
 * ランダムな順子を生成する（0符）
 * 順子生成
 */
export function createRandomShuntsu(): MentsuResult | undefined {
  const base = randomChoice(SUIT_BASES);
  const start = randomInt(0, 6);
  const t1 = base + start;
  const t2 = base + start + 1;
  const t3 = base + start + 2;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(t3)) {
    return undefined;
  }

  const isFuro = Math.random() < 0.5;
  const hais = [t1, t2, t3] as const;

  const mentsu: Shuntsu = isFuro
    ? {
        type: MentsuType.Shuntsu,
        hais,
        furo: { type: FuroType.Chi, from: Tacha.Kamicha },
      }
    : { type: MentsuType.Shuntsu, hais };

  return { mentsu, fu: 0, explanation: "順子は常に0符です" };
}

/**
 * ランダムな刻子を生成する（2〜8符）
 * 刻子生成
 */
export function createRandomKoutsu(): MentsuResult {
  const isYaochu = Math.random() < 0.5;
  const isOpen = Math.random() < 0.5;

  const tile = isYaochu ? randomYaochu() : randomSimple();
  const hais = [tile, tile, tile] as const;

  const mentsu: Koutsu = isOpen
    ? {
        type: MentsuType.Koutsu,
        hais,
        furo: { type: FuroType.Pon, from: Tacha.Toimen },
      }
    : { type: MentsuType.Koutsu, hais };

  const fu = calculateMentsuFu({ isKantsu: false, isOpen, isYaochu });

  const typeStr = yaochuLabel(isYaochu);
  const stateStr = `${openLabel(isOpen)}刻`;

  return { mentsu, fu, explanation: `${typeStr}の${stateStr}は${fu}符です` };
}

/**
 * ランダムな槓子を生成する（8〜32符）
 * 槓子生成
 */
export function createRandomKantsu(): MentsuResult {
  const isYaochu = Math.random() < 0.5;
  const isOpen = Math.random() < 0.5;

  const tile = isYaochu ? randomYaochu() : randomSimple();
  const hais = [tile, tile, tile, tile] as const;

  const mentsu: Kantsu = isOpen
    ? {
        type: MentsuType.Kantsu,
        hais,
        furo: { type: FuroType.Daiminkan, from: Tacha.Toimen },
      }
    : { type: MentsuType.Kantsu, hais };

  const fu = calculateMentsuFu({ isKantsu: true, isOpen, isYaochu });

  const typeStr = yaochuLabel(isYaochu);
  const stateStr = isOpen
    ? `${openLabel(true)}槓（または加槓）`
    : `${openLabel(false)}槓`;

  return { mentsu, fu, explanation: `${typeStr}の${stateStr}は${fu}符です` };
}

/**
 * 面子種別の確率重み
 * 面子生成重み
 */
export interface MentsuWeights {
  /** 順子の確率（0〜1） */
  readonly shuntsu: number;
  /** 刻子の確率（0〜1、残りが槓子） */
  readonly koutsu: number;
}

/**
 * 重み付きでランダムな面子を生成する
 * 面子ランダム生成
 *
 * @param weights - 面子種別の確率重み
 */
export function createRandomMentsu(
  weights: Readonly<MentsuWeights>,
): MentsuResult {
  switch (pickMentsuType(weights)) {
    case "shuntsu":
      return createRandomShuntsu() ?? createRandomKoutsu();
    case "koutsu":
      return createRandomKoutsu();
    case "kantsu":
      return createRandomKantsu();
  }
}
