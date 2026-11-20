import { describe, expect, it } from "vitest";
import type { HaiKindId } from "@pai-forge/riichi-mahjong";

import { expectSampled } from "../../test/sampling";
import { seededRandom } from "../../test/seeded-random";
import { generateMachiFuQuestion } from "./generator";
import type { MachiFuQuestion } from "./types";

/** 数牌かどうか（0〜26 が萬子・筒子・索子、27 以降が字牌） */
function isSuited(tile: HaiKindId): boolean {
  return tile < 27;
}

/** 数牌の花色インデックス（0=萬子 / 1=筒子 / 2=索子） */
function suitOf(tile: HaiKindId): number {
  return Math.floor(tile / 9);
}

/** 数牌の数字（1〜9） */
function numberOf(tile: HaiKindId): number {
  return (tile % 9) + 1;
}

/**
 * 待ちの形を牌の並びから判定する
 * 待ち形判定
 *
 * ジェネレータが付ける名前ではなく牌の構造から決める。出題データの
 * 「形」と「符」が食い違っていないことを、ラベルに頼らず検証するため。
 */
type Shape = "ryanmen" | "penchan" | "kanchan" | "tanki" | "shanpon";

function classify(question: Readonly<MachiFuQuestion>): Shape {
  const { tiles } = question;

  if (tiles.length === 1) return "tanki";
  if (tiles.length === 4) return "shanpon";

  const [a, b] = tiles;
  if (numberOf(b) - numberOf(a) === 2) return "kanchan";

  // 隣り合う2枚。両端のうち片方しか待てない（12 / 89）なら辺張
  const isEdge = numberOf(a) === 1 || numberOf(b) === 9;
  return isEdge ? "penchan" : "ryanmen";
}

/** 形ごとの正解符 */
const FU_BY_SHAPE: Readonly<Record<Shape, number>> = {
  ryanmen: 0,
  penchan: 2,
  kanchan: 2,
  tanki: 2,
  shanpon: 0,
};

/** 和了牌が、牌の並びから決まる待ち形の待てる牌であることを確かめる */
function expectAgariHaiFitsShape(question: Readonly<MachiFuQuestion>): void {
  const { tiles, agariHai } = question;

  switch (classify(question)) {
    case "tanki":
      expect(agariHai).toBe(tiles[0]);
      break;
    case "shanpon":
      expect(tiles).toContain(agariHai);
      break;
    case "kanchan":
      // 嵌張はあいだの1枚だけを待つ
      expect(numberOf(agariHai)).toBe(numberOf(tiles[0]) + 1);
      expect(suitOf(agariHai)).toBe(suitOf(tiles[0]));
      break;
    case "penchan":
      // 辺張は塞がっていない側の1枚だけを待つ
      expect(numberOf(agariHai)).toBe(
        numberOf(tiles[0]) === 1
          ? numberOf(tiles[1]) + 1
          : numberOf(tiles[0]) - 1,
      );
      expect(suitOf(agariHai)).toBe(suitOf(tiles[0]));
      break;
    case "ryanmen":
      expect([numberOf(tiles[0]) - 1, numberOf(tiles[1]) + 1]).toContain(
        numberOf(agariHai),
      );
      expect(suitOf(agariHai)).toBe(suitOf(tiles[0]));
      break;
  }
}

/** 十分な件数を集める（1件も生成できなければ失敗） */
function samples(need = 500): readonly MachiFuQuestion[] {
  return expectSampled(() => generateMachiFuQuestion(), {
    need,
    attempts: need,
  });
}

describe("generateMachiFuQuestion", () => {
  it("ID は注入した採番関数から取る", () => {
    expect(generateMachiFuQuestion(() => "fixed-id").id).toBe("fixed-id");
  });

  it("符は形に対応した値になる", () => {
    for (const question of samples()) {
      expect(question.answer).toBe(FU_BY_SHAPE[classify(question)]);
    }
  });

  it("5つの待ち形がすべて出題される", () => {
    const seen = new Set(samples(2000).map(classify));

    expect([...seen].sort()).toEqual(
      (Object.keys(FU_BY_SHAPE) as Shape[]).sort(),
    );
  });

  it("和了牌は待ち形が待てる牌である", () => {
    for (const question of samples()) {
      expectAgariHaiFitsShape(question);
    }
  });

  it("順子系の待ちは同じ花色の数牌だけで構成される", () => {
    const suitedShapes: readonly Shape[] = ["ryanmen", "penchan", "kanchan"];
    const questions = expectSampled(() => generateMachiFuQuestion(), {
      need: 100,
      attempts: 2000,
      where: (q) => suitedShapes.includes(classify(q)),
    });

    for (const { tiles, agariHai } of questions) {
      for (const tile of [...tiles, agariHai]) {
        expect(isSuited(tile)).toBe(true);
        expect(suitOf(tile)).toBe(suitOf(tiles[0]));
      }
    }
  });

  it("双碰待ちは2種の対子で、和了牌はそのどちらか", () => {
    const questions = expectSampled(() => generateMachiFuQuestion(), {
      need: 50,
      attempts: 2000,
      where: (q) => classify(q) === "shanpon",
    });

    for (const { tiles, agariHai } of questions) {
      const [a, b, c, d] = tiles;
      expect(a).toBe(b);
      expect(c).toBe(d);
      // 2種は異なる牌で、必ず昇順（対子の順序が実行ごとに入れ替わらない）
      expect(a).toBeLessThan(c);
      expect([a, c]).toContain(agariHai);
    }
  });

  it("牌種 ID が 34 種の範囲に収まる", () => {
    for (const { tiles, agariHai } of samples()) {
      for (const tile of [...tiles, agariHai]) {
        expect(tile).toBeGreaterThanOrEqual(0);
        expect(tile).toBeLessThanOrEqual(33);
      }
    }
  });

  /**
   * 牌の並びは形そのもの（両面なら 67s）なので、実行ごとに順序が
   * 変わらないこと。双碰も対子2つを昇順に並べる。
   */
  it("牌は昇順に並ぶ", () => {
    for (const { tiles } of samples()) {
      for (let i = 1; i < tiles.length; i++) {
        expect(tiles[i]).toBeGreaterThanOrEqual(tiles[i - 1]);
      }
    }
  });
});

describe("generateMachiFuQuestion（乱数を固定した出題）", () => {
  /** シードを変えて問題を並べる（乱数を注入するので結果は毎回同じ） */
  const questions = Array.from({ length: 500 }, (_, seed) =>
    generateMachiFuQuestion(() => "id", seededRandom(seed)),
  );

  it("5つの待ち形がすべて出題される", () => {
    expect([...new Set(questions.map(classify))].sort()).toEqual(
      (Object.keys(FU_BY_SHAPE) as Shape[]).sort(),
    );
  });

  it("辺張は 12 と 89 のどちらの側も出題される", () => {
    const penchanStarts = new Set(
      questions
        .filter((question) => classify(question) === "penchan")
        .map(({ tiles }) => numberOf(tiles[0])),
    );
    expect([...penchanStarts].sort()).toEqual([1, 8]);
  });

  it("符は形に対応した値になる", () => {
    for (const question of questions) {
      expect(question.answer).toBe(FU_BY_SHAPE[classify(question)]);
    }
  });

  it("和了牌は待ち形が待てる牌である", () => {
    for (const question of questions) {
      expectAgariHaiFitsShape(question);
    }
  });

  it("順子系の待ちは同じ花色の昇順の 2 枚で、和了牌も同じ花色である", () => {
    for (const question of questions) {
      const shape = classify(question);
      if (shape === "tanki" || shape === "shanpon") continue;
      const [first, second] = question.tiles;
      expect(question.tiles).toHaveLength(2);
      expect(second).toBeGreaterThan(first);
      for (const tile of [first, second, question.agariHai]) {
        expect(isSuited(tile)).toBe(true);
        expect(suitOf(tile)).toBe(suitOf(first));
      }
    }
  });
});
