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
import type { MentsuFuQuestion } from "./types";
import { randomInt, randomChoice } from "../../core/random";
import { isHaiKindId } from "../../core/type-guards";

/**
 * 数牌の花色ベース値
 * 数牌花色
 */
const SUIT_BASES: readonly HaiKindId[] = [
  HaiKind.ManZu1,
  HaiKind.PinZu1,
  HaiKind.SouZu1,
].filter(isHaiKindId);

/** 么九牌（端牌＋字牌） */
const YAOCHU: readonly HaiKindId[] = [
  HaiKind.ManZu1, HaiKind.ManZu9,
  HaiKind.PinZu1, HaiKind.PinZu9,
  HaiKind.SouZu1, HaiKind.SouZu9,
  HaiKind.Ton, HaiKind.Nan, HaiKind.Sha, HaiKind.Pei,
  HaiKind.Haku, HaiKind.Hatsu, HaiKind.Chun,
].filter(isHaiKindId);

/**
 * ランダムな中張牌を生成
 * 中張牌生成
 */
function randomSimple(): HaiKindId {
  const base = randomChoice(SUIT_BASES);
  const num = randomInt(2, 8);
  const id = base + num - 1;
  if (isHaiKindId(id)) return id;
  return HaiKind.ManZu5;
}

/**
 * ランダムな么九牌を生成
 * 么九牌生成
 */
function randomYaochu(): HaiKindId {
  return randomChoice(YAOCHU);
}

/**
 * 順子の問題を生成（0符）
 * 順子問題生成
 */
function createShuntsu(): MentsuFuQuestion | undefined {
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
    ? { type: MentsuType.Shuntsu, hais, furo: { type: FuroType.Chi, from: Tacha.Kamicha } }
    : { type: MentsuType.Shuntsu, hais };

  return {
    id: crypto.randomUUID(),
    mentsu,
    answer: 0,
    explanation: "順子は常に0符です",
  };
}

/**
 * 刻子の問題を生成（2〜8符）
 * 刻子問題生成
 */
function createKoutsu(): MentsuFuQuestion {
  const isYaochu = Math.random() < 0.5;
  const isOpen = Math.random() < 0.5;

  const tile = isYaochu ? randomYaochu() : randomSimple();
  const hais = [tile, tile, tile] as const;

  const mentsu: Koutsu = isOpen
    ? { type: MentsuType.Koutsu, hais, furo: { type: FuroType.Pon, from: Tacha.Toimen } }
    : { type: MentsuType.Koutsu, hais };

  let fu = 2;
  if (!isOpen) fu *= 2;
  if (isYaochu) fu *= 2;

  const typeStr = isYaochu ? "么九牌" : "中張牌";
  const stateStr = isOpen ? "明刻" : "暗刻";

  return {
    id: crypto.randomUUID(),
    mentsu,
    answer: fu,
    explanation: `${typeStr}の${stateStr}は${fu}符です`,
  };
}

/**
 * 槓子の問題を生成（8〜32符）
 * 槓子問題生成
 */
function createKantsu(): MentsuFuQuestion {
  const isYaochu = Math.random() < 0.5;
  const isOpen = Math.random() < 0.5;

  const tile = isYaochu ? randomYaochu() : randomSimple();
  const hais = [tile, tile, tile, tile] as const;

  const mentsu: Kantsu = isOpen
    ? { type: MentsuType.Kantsu, hais, furo: { type: FuroType.Daiminkan, from: Tacha.Toimen } }
    : { type: MentsuType.Kantsu, hais };

  let fu = 8;
  if (!isOpen) fu *= 2;
  if (isYaochu) fu *= 2;

  const typeStr = isYaochu ? "么九牌" : "中張牌";
  const stateStr = isOpen ? "明槓（または加槓）" : "暗槓";

  return {
    id: crypto.randomUUID(),
    mentsu,
    answer: fu,
    explanation: `${typeStr}の${stateStr}は${fu}符です`,
  };
}

/**
 * 面子の符計算問題を生成する
 * 面子符問題ジェネレータ
 */
export function generateMentsuFuQuestion(): MentsuFuQuestion {
  const r = Math.random();

  // 20% 順子, 50% 刻子, 30% 槓子
  if (r < 0.2) {
    const result = createShuntsu();
    if (result) return result;
    return createKoutsu();
  }
  if (r < 0.7) return createKoutsu();
  return createKantsu();
}
