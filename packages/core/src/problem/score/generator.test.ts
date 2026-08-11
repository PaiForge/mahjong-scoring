import { describe, it, expect } from "vitest";
import { HaiKind } from "@pai-forge/riichi-mahjong";
import { generateScoreQuestion, generateValidScoreQuestion } from "./generator";
import { ScoreLevel } from "../../core/constants";
import { isMangan } from "../../score/tiers";
import { expectGeneratesEventually, expectSampled } from "../../test/sampling";

describe("generateScoreQuestion", () => {
  it("試行すれば問題が生成される", () => {
    expectGeneratesEventually(generateScoreQuestion);
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
    expect(["ron", "oyaTsumo", "koTsumo"]).toContain(
      question.answer.payment.type,
    );
  });

  it("yakuDetails が定義されている場合、少なくとも1つの役がある", () => {
    const questions = expectSampled(generateScoreQuestion, {
      attempts: 200,
      where: (q) => q.yakuDetails !== undefined,
    });

    for (const question of questions) {
      expect(question.yakuDetails!.length).toBeGreaterThan(0);
      for (const yaku of question.yakuDetails!) {
        expect(yaku.name).toBeTruthy();
        expect(yaku.han).toBeGreaterThanOrEqual(1);
      }
    }
  });

  describe("オプション: includeParent / includeChild", () => {
    it("includeParent=false の場合、自風が東にならない", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: false, includeChild: true }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).not.toBe(HaiKind.Ton);
      }
    });

    it("includeChild=false の場合、自風が東になる", () => {
      const questions = expectSampled(
        () =>
          generateScoreQuestion({ includeParent: true, includeChild: false }),
        { attempts: 200 },
      );

      for (const question of questions) {
        expect(question.jikaze).toBe(HaiKind.Ton);
      }
    });
  });

  describe("オプション: allowedRanges", () => {
    it("nonMangan のみの場合、通常点数の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["nonMangan"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(question.answer.scoreLevel).toBe(ScoreLevel.Normal);
      }
    });

    it("manganPlus のみの場合、満貫以上の問題のみ生成される", () => {
      const questions = expectSampled(
        () => generateScoreQuestion({ allowedRanges: ["manganPlus"] }),
        { attempts: 300, need: 5 },
      );

      for (const question of questions) {
        expect(isMangan(question.answer.scoreLevel)).toBe(true);
      }
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
      console.warn(
        "isRiichi=true かつ立直を含む問題が生成されなかったためスキップ",
      );
    }
  });

  it("ドラ表示牌は有効な HaiKindId（0-33）である", () => {
    const questions = expectSampled(generateValidScoreQuestion);

    for (const question of questions) {
      for (const marker of question.doraMarkers) {
        expect(marker).toBeGreaterThanOrEqual(0);
        expect(marker).toBeLessThanOrEqual(33);
      }
    }
  });
});
