import { describe, it, expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
} from "./mentsu-factory";
import { expectSampled } from "../../test/sampling";

/** 生成できた順子を集める（1件も生成できなければ失敗） */
function shuntsuSamples() {
  return expectSampled(createRandomShuntsu, { need: 50, attempts: 200 });
}

/** 明刻/暗刻 × 中張牌/么九牌 の4通りを表すキー */
function comboKey(isOpen: boolean, isYaochu: boolean): string {
  return `${isOpen ? "open" : "closed"}-${isYaochu ? "yaochu" : "chunchan"}`;
}

/** 么九牌（老頭牌 + 字牌）かどうか */
function isYaochuTile(tile: number): boolean {
  return tile % 9 === 0 || tile % 9 === 8 || tile >= 27;
}

describe("createRandomShuntsu", () => {
  it("順子は常に0符", () => {
    for (const result of shuntsuSamples()) {
      expect(result.fu).toBe(0);
      expect(result.mentsu.type).toBe(MentsuType.Shuntsu);
    }
  });

  it("牌が連番になっている", () => {
    for (const result of shuntsuSamples()) {
      const [a, b, c] = result.mentsu.hais;
      expect(b - a).toBe(1);
      expect(c - b).toBe(1);
    }
  });

  it("牌が同じ花色内に収まる", () => {
    for (const result of shuntsuSamples()) {
      const [a, , c] = result.mentsu.hais;
      // 同じ花色 = 同じ9牌のブロック内（0-8, 9-17, 18-26）
      expect(Math.floor(a / 9)).toBe(Math.floor(c / 9));
    }
  });
});

describe("createRandomKoutsu", () => {
  it("刻子は2, 4, 8のいずれか", () => {
    const validFu = new Set([2, 4, 8]);
    for (let i = 0; i < 100; i++) {
      const result = createRandomKoutsu();
      expect(validFu.has(result.fu)).toBe(true);
      expect(result.mentsu.type).toBe(MentsuType.Koutsu);
    }
  });

  it("刻子の3牌は全て同じ牌種", () => {
    for (let i = 0; i < 50; i++) {
      const result = createRandomKoutsu();
      const [a, b, c] = result.mentsu.hais;
      expect(a).toBe(b);
      expect(b).toBe(c);
    }
  });

  it("明刻は暗刻の半分の符", () => {
    const expected: Readonly<Record<string, number>> = {
      "open-chunchan": 2,
      "closed-chunchan": 4,
      "open-yaochu": 4,
      "closed-yaochu": 8,
    };
    const seen = new Set<string>();

    for (let i = 0; i < 300; i++) {
      const result = createRandomKoutsu();
      const key = comboKey(
        "furo" in result.mentsu,
        isYaochuTile(result.mentsu.hais[0]),
      );
      seen.add(key);
      expect(result.fu).toBe(expected[key]);
    }

    // 4通りのどれかが一度も出ないと、その行は検証されないまま pass する
    expect([...seen].sort()).toEqual(Object.keys(expected).sort());
  });
});

describe("createRandomKantsu", () => {
  it("槓子は8, 16, 32のいずれか", () => {
    const validFu = new Set([8, 16, 32]);
    for (let i = 0; i < 100; i++) {
      const result = createRandomKantsu();
      expect(validFu.has(result.fu)).toBe(true);
      expect(result.mentsu.type).toBe(MentsuType.Kantsu);
    }
  });

  it("槓子の4牌は全て同じ牌種", () => {
    for (let i = 0; i < 50; i++) {
      const result = createRandomKantsu();
      const [a, b, c, d] = result.mentsu.hais;
      expect(a).toBe(b);
      expect(b).toBe(c);
      expect(c).toBe(d);
    }
  });

  it("明槓は暗槓の半分の符", () => {
    const expected: Readonly<Record<string, number>> = {
      "open-chunchan": 8,
      "closed-chunchan": 16,
      "open-yaochu": 16,
      "closed-yaochu": 32,
    };
    const seen = new Set<string>();

    for (let i = 0; i < 300; i++) {
      const result = createRandomKantsu();
      const key = comboKey(
        "furo" in result.mentsu,
        isYaochuTile(result.mentsu.hais[0]),
      );
      seen.add(key);
      expect(result.fu).toBe(expected[key]);
    }

    // 4通りのどれかが一度も出ないと、その行は検証されないまま pass する
    expect([...seen].sort()).toEqual(Object.keys(expected).sort());
  });
});
