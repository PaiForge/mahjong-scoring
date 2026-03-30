import { HaiKind, type HaiKindId } from "@pai-forge/riichi-mahjong";
import type { MachiFuQuestion } from "./types";
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

/**
 * 両面待ちを生成（0符）
 * 両面待ち生成
 */
function createRyanmen(): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  // start: 2〜7 → 牌 [start, start+1] で待ち [start-1] or [start+2]
  const start = randomInt(2, 7);

  const t1 = base + start - 1;
  const t2 = base + start;
  const wait1 = base + start - 2;
  const wait2 = base + start + 1;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(wait1) || !isHaiKindId(wait2)) {
    return undefined;
  }

  const agari = Math.random() < 0.5 ? wait1 : wait2;

  return {
    id: crypto.randomUUID(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 0,
    shapeName: "両面待ち",
    explanation: "両面待ちは0符です",
  };
}

/**
 * 辺張待ちを生成（2符）
 * 辺張待ち生成
 */
function createPenchan(): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  const isLow = Math.random() < 0.5; // 12待ち3 or 89待ち7

  const t1 = isLow ? base : base + 7;
  const t2 = isLow ? base + 1 : base + 8;
  const agari = isLow ? base + 2 : base + 6;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(agari)) {
    return undefined;
  }

  return {
    id: crypto.randomUUID(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 2,
    shapeName: "ペンチャン待ち",
    explanation: "ペンチャン待ちは2符です",
  };
}

/**
 * 嵌張待ちを生成（2符）
 * 嵌張待ち生成
 */
function createKanchan(): MachiFuQuestion | undefined {
  const base = randomChoice(SUIT_BASES);
  const center = randomInt(2, 8); // 間の牌は 2〜8

  const t1 = base + center - 2;
  const t2 = base + center;
  const agari = base + center - 1;

  if (!isHaiKindId(t1) || !isHaiKindId(t2) || !isHaiKindId(agari)) {
    return undefined;
  }

  return {
    id: crypto.randomUUID(),
    tiles: [t1, t2],
    agariHai: agari,
    answer: 2,
    shapeName: "カンチャン待ち",
    explanation: "カンチャン待ちは2符です",
  };
}

/**
 * 単騎待ちを生成（2符）
 * 単騎待ち生成
 */
function createTanki(): MachiFuQuestion | undefined {
  const hai = Math.floor(Math.random() * 34);
  if (!isHaiKindId(hai)) return undefined;

  return {
    id: crypto.randomUUID(),
    tiles: [hai],
    agariHai: hai,
    answer: 2,
    shapeName: "単騎待ち",
    explanation: "単騎待ちは2符です",
  };
}

/**
 * 双碰待ちを生成（0符）
 * 双碰待ち生成
 */
function createShanpon(): MachiFuQuestion | undefined {
  const t1 = Math.floor(Math.random() * 34);
  if (!isHaiKindId(t1)) return undefined;

  let t2 = Math.floor(Math.random() * 34);
  while (t1 === t2) {
    t2 = Math.floor(Math.random() * 34);
  }
  if (!isHaiKindId(t2)) return undefined;

  const agari = Math.random() < 0.5 ? t1 : t2;

  return {
    id: crypto.randomUUID(),
    tiles: [t1, t1, t2, t2],
    agariHai: agari,
    answer: 0,
    shapeName: "シャンポン待ち",
    explanation: "シャンポン待ちは0符です",
  };
}

/**
 * 待ちの符計算問題を生成する
 * 待ち符問題ジェネレータ
 */
export function generateMachiFuQuestion(): MachiFuQuestion {
  const patterns = [
    createRyanmen,
    createPenchan,
    createKanchan,
    createTanki,
    createShanpon,
  ];

  const r = Math.random();
  const index = r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.6 ? 2 : r < 0.8 ? 3 : 4;
  const result = patterns[index]();

  if (result) return result;

  // フォールバック: 単騎 → 双碰
  return createTanki() ?? createShanpon() ?? createTanki()!;
}
