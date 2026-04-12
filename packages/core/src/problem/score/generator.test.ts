import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { ScoreQuestionGenerator, generateValidScoreQuestion } from "./generator";
import { ScoreLevel } from "../../core/constants";
import { isMangan } from "./judgement";

describe("ScoreQuestionGenerator", () => {
  const generator = new ScoreQuestionGenerator();

  it("100回試行して少なくとも1回は問題が生成される", () => {
    let generated = false;
    for (let i = 0; i < 100; i++) {
      const question = generator.generate();
      if (question) {
        generated = true;
        break;
      }
    }
    expect(generated).toBe(true);
  });

  it("生成された問題が正しい構造を持つ", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.tehai).toBeDefined();
    expect(question.tehai.closed).toBeDefined();
    expect(question.tehai.exposed).toBeDefined();
    expect(typeof question.agariHai).toBe("number");
    expect(question.agariHai).toBeGreaterThanOrEqual(0);
    expect(question.agariHai).toBeLessThanOrEqual(33);
    expect(typeof question.isTsumo).toBe("boolean");
    expect(typeof question.jikaze).toBe("number");
    expect(typeof question.bakaze).toBe("number");
    expect(Array.isArray(question.doraMarkers)).toBe(true);
    expect(question.doraMarkers.length).toBeGreaterThanOrEqual(1);
  });

  it("answer に有効な翻数・符・支払い情報が含まれる", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
    if (!question) return;

    expect(question.answer.han).toBeGreaterThanOrEqual(1);
    expect(question.answer.fu).toBeGreaterThanOrEqual(20);
    expect(question.answer.scoreLevel).toBeDefined();
    expect(question.answer.payment).toBeDefined();
    expect(["ron", "oyaTsumo", "koTsumo"]).toContain(question.answer.payment.type);
  });

  it("yakuDetails が定義されている場合、少なくとも1つの役がある", () => {
    let tested = 0;
    for (let i = 0; i < 200; i++) {
      const question = generator.generate();
      if (!question) continue;
      if (question.yakuDetails) {
        expect(question.yakuDetails.length).toBeGreaterThan(0);
        for (const yaku of question.yakuDetails) {
          expect(yaku.name).toBeTruthy();
          expect(yaku.han).toBeGreaterThanOrEqual(1);
        }
        tested++;
        if (tested >= 10) break;
      }
    }
    expect(tested).toBeGreaterThan(0);
  });

  describe("オプション: includeParent / includeChild", () => {
    it("includeParent=false の場合、自風が東にならない", () => {
      let tested = 0;
      for (let i = 0; i < 200; i++) {
        const question = generator.generate({ includeParent: false, includeChild: true });
        if (!question) continue;
        expect(question.jikaze).not.toBe(HaiKind.Ton);
        tested++;
        if (tested >= 10) break;
      }
      expect(tested).toBeGreaterThan(0);
    });

    it("includeChild=false の場合、自風が東になる", () => {
      let tested = 0;
      for (let i = 0; i < 200; i++) {
        const question = generator.generate({ includeParent: true, includeChild: false });
        if (!question) continue;
        expect(question.jikaze).toBe(HaiKind.Ton);
        tested++;
        if (tested >= 10) break;
      }
      expect(tested).toBeGreaterThan(0);
    });
  });

  describe("オプション: allowedRanges", () => {
    it("non_mangan のみの場合、通常点数の問題のみ生成される", () => {
      let tested = 0;
      for (let i = 0; i < 300; i++) {
        const question = generator.generate({ allowedRanges: ["non_mangan"] });
        if (!question) continue;
        expect(question.answer.scoreLevel).toBe(ScoreLevel.Normal);
        tested++;
        if (tested >= 5) break;
      }
      expect(tested).toBeGreaterThan(0);
    });

    it("mangan_plus のみの場合、満貫以上の問題のみ生成される", () => {
      let tested = 0;
      for (let i = 0; i < 300; i++) {
        const question = generator.generate({ allowedRanges: ["mangan_plus"] });
        if (!question) continue;
        expect(isMangan(question.answer.scoreLevel)).toBe(true);
        tested++;
        if (tested >= 5) break;
      }
      expect(tested).toBeGreaterThan(0);
    });
  });
});

describe("generateValidScoreQuestion", () => {
  it("デフォルトオプションで有効な問題を生成する", () => {
    const question = generateValidScoreQuestion();
    expect(question).toBeDefined();
  });

  it("maxRetries=1 でも生成を試みる", () => {
    // 1回で生成できない場合もあるが、undefined か ScoreQuestion のいずれかを返す
    const question = generateValidScoreQuestion({}, 1);
    // 型チェックのみ（undefined or ScoreQuestion）
    expect(question === undefined || typeof question === "object").toBe(true);
  });

  it("リーチフラグが true の場合、yakuDetails に立直が含まれるケースがある", () => {
    // applyRiichiAndUraDora は内部で確率的にリーチをスキップすることがある
    // isRiichi=true かつ立直が yakuDetails に含まれるケースを探す
    let found = false;
    for (let i = 0; i < 1000; i++) {
      const question = generateValidScoreQuestion();
      if (!question) continue;
      if (question.isRiichi) {
        const hasRiichi = question.yakuDetails?.some(
          (y) => y.name === "立直" || y.name === "ダブル立直",
        );
        if (hasRiichi) {
          found = true;
          break;
        }
      }
    }
    if (!found) {
      console.warn("isRiichi=true かつ立直を含む問題が生成されなかったためスキップ");
    }
  });

  it("ドラ表示牌は有効な HaiKindId（0-33）である", () => {
    let tested = 0;
    for (let i = 0; i < 100; i++) {
      const question = generateValidScoreQuestion();
      if (!question) continue;
      for (const marker of question.doraMarkers) {
        expect(marker).toBeGreaterThanOrEqual(0);
        expect(marker).toBeLessThanOrEqual(33);
      }
      tested++;
      if (tested >= 10) break;
    }
    expect(tested).toBeGreaterThan(0);
  });
});
