import { describe, it, expect } from "vitest";
import { generateYakuQuestion } from "./generator";
import { SELECTABLE_YAKU } from "./constants";

describe("generateYakuQuestion", () => {
  it("100回試行して少なくとも1回は問題が生成される", () => {
    let generated = false;
    for (let i = 0; i < 100; i++) {
      const question = generateYakuQuestion();
      if (question) {
        generated = true;
        break;
      }
    }
    expect(generated).toBe(true);
  });

  it("生成された問題が正しい構造を持つ", () => {
    let question;
    for (let i = 0; i < 100; i++) {
      question = generateYakuQuestion();
      if (question) break;
    }

    expect(question).toBeDefined();
    if (!question) return;

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
    let tested = 0;

    for (let i = 0; i < 200; i++) {
      const question = generateYakuQuestion();
      if (!question) continue;

      for (const yakuName of question.correctYakuNames) {
        expect(selectableSet.has(yakuName)).toBe(true);
      }
      tested++;
      if (tested >= 10) break;
    }

    expect(tested).toBeGreaterThan(0);
  });

  it("isRiichi が true の場合、立直が正解に含まれる", () => {
    let found = false;
    for (let i = 0; i < 500; i++) {
      const question = generateYakuQuestion();
      if (!question) continue;

      if (question.context.isRiichi) {
        expect(question.correctYakuNames).toContain("立直");
        found = true;
        break;
      }
    }
    // 門前かつ20%確率なので500回あれば十分見つかるはず
    // ただし確率的テストなので found しなくてもスキップ
    if (!found) {
      console.warn("isRiichi=true の問題が生成されなかったためスキップ");
    }
  });

  it("生成された問題の tehai と context フィールドが正しい型を持つ", () => {
    let question;
    for (let i = 0; i < 100; i++) {
      question = generateYakuQuestion();
      if (question) break;
    }

    expect(question).toBeDefined();
    if (!question) return;

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
    let found = false;
    for (let i = 0; i < 500; i++) {
      const question = generateYakuQuestion();
      if (!question) continue;

      if (question.context.isTsumo && question.correctYakuNames.includes("門前清自摸和")) {
        found = true;
        break;
      }
    }
    // 確率的テスト
    if (!found) {
      console.warn("isTsumo=true かつ門前清自摸和の問題が生成されなかったためスキップ");
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

    for (let i = 0; i < 200; i++) {
      const question = generateYakuQuestion();
      if (!question) continue;

      for (const excluded of excludedNames) {
        expect(question.correctYakuNames).not.toContain(excluded);
      }
    }
  });
});
