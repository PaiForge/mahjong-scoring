import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "@mahjong-scoring/features/board/demo-score-question";
import { parseHanCountResults, toHanCountQuestionResult } from "./types";

describe("parseHanCountResults", () => {
  /** 翻数問題結果の出題スナップショットの有効なデータ */
  const validSnapshot = {
    tehai: "234567m345p55678s",
    agariHai: "3p",
    bakaze: "1z",
    jikaze: "2z",
    doraMarkers: ["1m"],
    isRiichi: true,
    uraDoraMarkers: ["5s"],
    isTsumo: true,
    yakuDetails: [
      { name: "立直", han: 1 },
      { name: "ドラ", han: 2 },
    ],
    ruleConfig: { doubleWindJantouFu: 2, kiriageMangan: false },
  };

  /** 翻数問題結果の有効なデータ */
  const validResult = {
    correctHan: 3,
    userHan: 3,
    outcome: "correct",
    question: validSnapshot,
  };

  // --- 正常系 ---

  it("有効な JSON 文字列をパースできる", () => {
    const raw = [validResult];
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  // --- 境界値 ---

  it("han=1（最小翻数）を含む結果をパースできる", () => {
    const result = { ...validResult, correctHan: 1, userHan: 1 };
    const raw = [result];
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctHan).toBe(1);
  });

  it("han=13（役満相当）を含む結果をパースできる", () => {
    const result = { ...validResult, correctHan: 13, userHan: 13 };
    const raw = [result];
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctHan).toBe(13);
  });

  // --- 不正データフィルタリング: 必須フィールドの欠損 ---

  it("correctHan が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "correctHan");
    const raw = [invalid];
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("userHan が欠落した要素は時間切れ（回答なし）として許容される", () => {
    const timeUp = { ...validResult, outcome: "timeUp" };
    Reflect.deleteProperty(timeUp, "userHan");
    const raw = [timeUp];
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
  });

  it("outcome が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "outcome");
    const raw = [invalid];
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  // --- 不正データフィルタリング: 型の不一致 ---

  it("correctHan が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, correctHan: "3" };
    const raw = [invalid];
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("userHan が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, userHan: "3" };
    const raw = [invalid];
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("outcome が既知の値でない場合はフィルタされる", () => {
    const invalid = { ...validResult, outcome: "unknown" };
    const raw = [invalid];
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  // --- 出題スナップショット ---

  describe("question スナップショット", () => {
    it("スナップショットを持たない要素はフィルタされる", () => {
      const invalid = { ...validResult };
      Reflect.deleteProperty(invalid, "question");
      expect(parseHanCountResults([invalid])).toEqual([]);
    });

    it("isTsumo を欠くスナップショットを持つ要素はフィルタされる", () => {
      const question = { ...validSnapshot };
      Reflect.deleteProperty(question, "isTsumo");
      const raw = [{ ...validResult, question }];
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("yakuDetails を欠くスナップショットを持つ要素はフィルタされる", () => {
      const question = { ...validSnapshot };
      Reflect.deleteProperty(question, "yakuDetails");
      const raw = [{ ...validResult, question }];
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("yakuDetails の翻数が数値でない要素はフィルタされる", () => {
      const question = {
        ...validSnapshot,
        yakuDetails: [{ name: "立直", han: "1" }],
      };
      const raw = [{ ...validResult, question }];
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("手牌が文字列でないスナップショットを持つ要素はフィルタされる", () => {
      const question = { ...validSnapshot, tehai: 42 };
      const raw = [{ ...validResult, question }];
      expect(parseHanCountResults(raw)).toEqual([]);
    });
  });
});

/**
 * 翻数即答の出題を組み立てる
 *
 * `buildDemoScoreQuestion` は描画用のデモ出題で `answer` とルール設定を
 * 持たないため、翻数・役の内訳・ルール設定をここで足す。
 */
function buildQuestion(
  han: number,
  yakuDetails: readonly { name: string; han: number }[],
): ScoreQuestion {
  return {
    ...buildDemoScoreQuestion({
      doraMarkers: [HaiKind.ManZu1],
      isRiichi: false,
    }),
    answer: { han },
    yakuDetails,
    ruleConfig: {},
  } as unknown as ScoreQuestion;
}

describe("toHanCountQuestionResult", () => {
  it("出題と回答から結果を組み立てる", () => {
    const question = buildQuestion(3, [
      { name: "平和", han: 1 },
      { name: "ドラ", han: 2 },
    ]);
    const result = toHanCountQuestionResult(question, 3);

    expect(result.correctHan).toBe(3);
    expect(result.userHan).toBe(3);
    expect(result.outcome).toBe("correct");
    expect(result.question.isTsumo).toBe(true);
    expect(result.question.yakuDetails).toEqual([
      { name: "平和", han: 1 },
      { name: "ドラ", han: 2 },
    ]);
  });

  it("誤答を outcome=incorrect として記録する", () => {
    const question = buildQuestion(3, [{ name: "平和", han: 3 }]);
    expect(toHanCountQuestionResult(question, 2).outcome).toBe("incorrect");
  });

  it("13翻以上の正解は役満（13翻）に丸めて判定する", () => {
    const question = buildQuestion(16, [
      { name: "四暗刻", han: 13 },
      { name: "ドラ", han: 3 },
    ]);
    const result = toHanCountQuestionResult(question, 13);

    expect(result.correctHan).toBe(13);
    expect(result.outcome).toBe("correct");
    // 丸め前の翻数は内訳の合計として残る
    expect(result.question.yakuDetails.reduce((sum, d) => sum + d.han, 0)).toBe(
      16,
    );
  });

  it("組み立てた結果はパーサーのバリデーションを通過する", () => {
    const question = buildQuestion(2, [{ name: "断幺九", han: 2 }]);
    const raw = [toHanCountQuestionResult(question, 2)];
    const results = parseHanCountResults(raw);

    expect(results).toHaveLength(1);
    expect(results[0]?.question.tehai).toBe("234567m345p55678s");
  });

  it("回答なし（時間切れ）は outcome=timeUp で記録し、パースを通過する", () => {
    const question = buildQuestion(3, [{ name: "平和", han: 3 }]);
    const result = toHanCountQuestionResult(question, undefined);

    expect(result.outcome).toBe("timeUp");
    expect(result.userHan).toBeUndefined();
    expect(result.correctHan).toBe(3);
    expect(parseHanCountResults([result])).toHaveLength(1);
  });
});
