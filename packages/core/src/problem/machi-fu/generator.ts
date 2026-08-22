import type { MachiFuQuestion } from "./types";
import { defaultIdGenerator, type IdGenerator } from "../../core/id";
import { randomBool, randomInt, randomChoice } from "../../core/random";
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
function createRyanmen(idGen: IdGenerator): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  // start: 2〜7 → 牌 [start, start+1] で待ち [start-1] or [start+2]
  const start = randomInt(2, 7);

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

  const agari = randomBool(0.5) ? wait1 : wait2;

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
function createPenchan(idGen: IdGenerator): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  const isLow = randomBool(0.5); // 12待ち3 or 89待ち7

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
function createKanchan(idGen: IdGenerator): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  const center = randomInt(2, 8); // 間の牌は 2〜8

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
function createTanki(idGen: IdGenerator): MachiFuQuestion {
  const hai = randomHaiKindId();

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
function createShanpon(idGen: IdGenerator): MachiFuQuestion {
  const t1 = randomHaiKindId();
  const t2 = randomHaiKindIdExcluding(t1);

  const agari = randomBool(0.5) ? t1 : t2;

  return {
    id: idGen(),
    tiles: [t1, t1, t2, t2],
    agariHai: agari,
    answer: 0,
  };
}

/**
 * 待ちの符計算問題を生成する
 * 待ち符問題ジェネレータ
 */
export function generateMachiFuQuestion(
  idGen: IdGenerator = defaultIdGenerator,
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
  return randomChoice(patterns)(idGen) ?? createTanki(idGen);
}
