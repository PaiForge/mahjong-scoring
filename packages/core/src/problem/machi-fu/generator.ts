import type { MachiFuQuestion } from "./types";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import {
  randomBool,
  randomInt,
  randomChoice,
  defaultRandomSource,
  type RandomSource,
} from "../../core/random";
import { isHaiKindId } from "../../core/type-guards";
import { SUIT_BASES } from "../../core/constants";
import {
  randomHaiKindId,
  randomHaiKindIdExcluding,
} from "../shared/tile-random";

/**
 * 両面待ちを生成（0符）
 * 両面待ち生成
 */
function createRyanmen(
  idGen: IdGenerator,
  rng: RandomSource,
): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES, rng);
  // start: 2〜7 → 牌 [start, start+1] で待ち [start-1] or [start+2]
  const start = randomInt(2, 7, rng);

  const t1 = base + start - 1;
  const t2 = base + start;
  const wait1 = base + start - 2;
  const wait2 = base + start + 1;

  if (
    !isHaiKindId(t1) ||
    !isHaiKindId(t2) ||
    !isHaiKindId(wait1) ||
    !isHaiKindId(wait2)
  ) {
    return undefined;
  }

  const agari = randomBool(0.5, rng) ? wait1 : wait2;

  return {
    id: idGen(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 0,
  };
}

/**
 * 辺張待ちを生成（2符）
 * 辺張待ち生成
 */
function createPenchan(
  idGen: IdGenerator,
  rng: RandomSource,
): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES, rng);
  const isLow = randomBool(0.5, rng); // 12待ち3 or 89待ち7

  const t1 = isLow ? base : base + 7;
  const t2 = isLow ? base + 1 : base + 8;
  const agari = isLow ? base + 2 : base + 6;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(agari)) {
    return undefined;
  }

  return {
    id: idGen(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 2,
  };
}

/**
 * 嵌張待ちを生成（2符）
 * 嵌張待ち生成
 */
function createKanchan(
  idGen: IdGenerator,
  rng: RandomSource,
): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES, rng);
  const center = randomInt(2, 8, rng); // 間の牌は 2〜8

  const t1 = base + center - 2;
  const t2 = base + center;
  const agari = base + center - 1;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(agari)) {
    return undefined;
  }

  return {
    id: idGen(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 2,
  };
}

/**
 * 単騎待ちを生成（2符）
 * 単騎待ち生成
 */
function createTanki(idGen: IdGenerator, rng: RandomSource): MachiFuQuestion {
  const hai = randomHaiKindId(rng);

  return {
    id: idGen(),
    tiles: [hai],
    agariHai: hai,
    answer: 2,
  };
}

/**
 * 双碰待ちを生成（0符）
 * 双碰待ち生成
 */
function createShanpon(idGen: IdGenerator, rng: RandomSource): MachiFuQuestion {
  const t1 = randomHaiKindId(rng);
  const t2 = randomHaiKindIdExcluding(t1, rng);

  const agari = randomBool(0.5, rng) ? t1 : t2;

  // 2つの対子は牌種の昇順で並べる。他の待ち形は牌の並びが形そのもの
  // （両面なら 67s のように昇順）なので、双碰だけ順不同にしない。
  const [lower, higher] = t1 < t2 ? [t1, t2] : [t2, t1];

  return {
    id: idGen(),
    tiles: [lower, lower, higher, higher],
    agariHai: agari,
    answer: 0,
  };
}

/**
 * 待ちの符計算問題を生成する
 * 待ち符問題ジェネレータ
 *
 * @param idGen - 問題 ID の採番（既定 crypto.randomUUID）
 * @param rng - 乱数供給源（既定 Math.random）
 */
export function generateMachiFuQuestion(
  idGen: IdGenerator = defaultIdGenerator,
  rng: RandomSource = defaultRandomSource,
): MachiFuQuestion {
  const patterns = [
    createRyanmen,
    createPenchan,
    createKanchan,
    createTanki,
    createShanpon,
  ];

  // 各パターンを等確率で出題する。順子系パターン（両面・辺張・嵌張）は
  // 牌範囲の検証に失敗しうるため、フォールバックとして常に成功する単騎を使う。
  return randomChoice(patterns, rng)(idGen, rng) ?? createTanki(idGen, rng);
}
