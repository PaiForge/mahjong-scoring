import { describe, it, expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import {
  createRandomShuntsu,
  createRandomKoutsu,
  createRandomKantsu,
} from "./mentsu-factory";

describe("createRandomShuntsu", () => {
  it("順子は常に0符", () => {
    for (let i = 0; i < 50; i++) {
      const result = createRandomShuntsu();
      if (result === undefined) continue;
      expect(result.fu).toBe(0);
      expect(result.mentsu.type).toBe(MentsuType.Shuntsu);
    }
  });

  it("牌が連番になっている", () => {
    for (let i = 0; i < 50; i++) {
      const result = createRandomShuntsu();
      if (result === undefined) continue;
      const [a, b, c] = result.mentsu.hais;
      expect(b - a).toBe(1);
      expect(c - b).toBe(1);
    }
  });

  it("牌が同じ花色内に収まる", () => {
    for (let i = 0; i < 50; i++) {
      const result = createRandomShuntsu();
      if (result === undefined) continue;
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
    // 中張牌明刻=2, 中張牌暗刻=4, 么九牌明刻=4, 么九牌暗刻=8
    for (let i = 0; i < 100; i++) {
      const result = createRandomKoutsu();
      const isOpen = "furo" in result.mentsu;
      const tile = result.mentsu.hais[0];
      const isYaochu =
        tile % 9 === 0 || tile % 9 === 8 || tile >= 27;

      if (isOpen && !isYaochu) expect(result.fu).toBe(2);
      if (!isOpen && !isYaochu) expect(result.fu).toBe(4);
      if (isOpen && isYaochu) expect(result.fu).toBe(4);
      if (!isOpen && isYaochu) expect(result.fu).toBe(8);
    }
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
    // 中張牌明槓=8, 中張牌暗槓=16, 么九牌明槓=16, 么九牌暗槓=32
    for (let i = 0; i < 100; i++) {
      const result = createRandomKantsu();
      const isOpen = "furo" in result.mentsu;
      const tile = result.mentsu.hais[0];
      const isYaochu =
        tile % 9 === 0 || tile % 9 === 8 || tile >= 27;

      if (isOpen && !isYaochu) expect(result.fu).toBe(8);
      if (!isOpen && !isYaochu) expect(result.fu).toBe(16);
      if (isOpen && isYaochu) expect(result.fu).toBe(16);
      if (!isOpen && isYaochu) expect(result.fu).toBe(32);
    }
  });
});
