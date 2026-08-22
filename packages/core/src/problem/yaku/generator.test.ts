import { describe, it, expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import { generateYakuQuestion } from "./generator";
import { SELECTABLE_YAKU } from "./constants";
import {
  expectGeneratesEventually,
  expectSampled,
  generateOne,
} from "../../test/sampling";

describe("generateYakuQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateYakuQuestion);
  });

  it("生成された問題が正しい構造を持つ", () => {
    const question = generateOne(generateYakuQuestion);

    expect(question.id).toBeTruthy();
    expect(question.tehai).toBeDefined();
    expect(question.context.bakaze).toBeDefined();
    expect(question.context.jikaze).toBeDefined();
    expect(question.context.agariHai).toBeDefined();
    expect(typeof question.context.isTsumo).toBe("boolean");
    expect(typeof question.context.isRiichi).toBe("boolean");
    expect(Array.isArray(question.context.doraMarkers)).toBe(true);
    expect(question.correctYakuNames.length).toBeGreaterThan(0);
  });

  it("正解の役名が SELECTABLE_YAKU に含まれる", () => {
    const selectableSet = new Set(SELECTABLE_YAKU);
    const questions = expectSampled(generateYakuQuestion, { attempts: 200 });

    for (const question of questions) {
      for (const yakuName of question.correctYakuNames) {
        expect(selectableSet.has(yakuName)).toBe(true);
      }
    }
  });

  it("isRiichi が true の場合、立直が正解に含まれる", () => {
    const questions = expectSampled(generateYakuQuestion, {
      need: 5,
      attempts: 1000,
      where: (q) => q.context.isRiichi,
    });

    for (const question of questions) {
      expect(question.correctYakuNames).toContain("立直");
    }
  });

  it("生成された問題の tehai と context フィールドが正しい型を持つ", () => {
    const question = generateOne(generateYakuQuestion);

    // tehai の構造
    expect(question.tehai.closed).toBeDefined();
    expect(Array.isArray(question.tehai.closed)).toBe(true);
    expect(question.tehai.exposed).toBeDefined();
    expect(Array.isArray(question.tehai.exposed)).toBe(true);

    // context のフィールド
    expect(typeof question.context.bakaze).toBe("number");
    expect(typeof question.context.jikaze).toBe("number");
    expect(typeof question.context.agariHai).toBe("number");
    expect(question.context.doraMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it("isTsumo=true かつ門前の場合、門前清自摸和が含まれるケースがある", () => {
    // 1件も出ないこと自体が異常なので、expectSampled の非空保証が検証になる
    expectSampled(generateYakuQuestion, {
      need: 1,
      attempts: 1000,
      where: (q) =>
        q.context.isTsumo && q.correctYakuNames.includes("門前清自摸和"),
    });
  });

  it("和了牌が槓子（カン）の牌種と一致しない", () => {
    // 槓子は同じ牌4枚を束縛するため5枚目が存在せず、その牌では和了できない。
    const questions = expectSampled(generateYakuQuestion, {
      attempts: 2000,
      need: 2000,
    });

    for (const q of questions) {
      for (const m of q.tehai.exposed) {
        if (m.type === MentsuType.Kantsu) {
          expect(q.context.agariHai).not.toBe(m.hais[0]);
        }
      }
    }
  });

  it("偶然役・ドラが正解に含まれない", () => {
    const excludedNames = [
      "ドラ",
      "裏ドラ",
      "一発",
      "海底摸月",
      "河底撈魚",
      "嶺上開花",
      "槍槓",
      "ダブル立直",
      "天和",
      "地和",
    ];

    const questions = expectSampled(generateYakuQuestion, {
      need: 200,
      attempts: 400,
    });

    for (const question of questions) {
      for (const excluded of excludedNames) {
        expect(question.correctYakuNames).not.toContain(excluded);
      }
    }
  });
});
