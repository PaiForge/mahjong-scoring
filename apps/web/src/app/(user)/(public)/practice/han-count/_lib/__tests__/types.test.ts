import { HaiKind } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { buildDemoScoreQuestion } from "../../../_lib/demo-score-question";
import { parseHanCountResults, toHanCountQuestionResult } from "../types";

describe("parseHanCountResults", () => {
  /** 翻数問題結果の有効なデータ */
  const validResult = {
    correctHan: 3,
    userHan: 3,
    isCorrect: true,
  };

  // --- 正常系 ---

  it("有効な JSON 文字列をパースできる", () => {
    const raw = JSON.stringify([validResult]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("複数件の結果をパースできる", () => {
    const incorrectResult = {
      correctHan: 5,
      userHan: 3,
      isCorrect: false,
    };
    const raw = JSON.stringify([validResult, incorrectResult]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(validResult);
    expect(results[1]).toEqual(incorrectResult);
  });

  it("空配列の JSON 文字列は空配列を返す", () => {
    const results = parseHanCountResults("[]");
    expect(results).toEqual([]);
  });

  // --- 境界値 ---

  it("han=1（最小翻数）を含む結果をパースできる", () => {
    const result = { correctHan: 1, userHan: 1, isCorrect: true };
    const raw = JSON.stringify([result]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctHan).toBe(1);
  });

  it("han=13（役満相当）を含む結果をパースできる", () => {
    const result = { correctHan: 13, userHan: 13, isCorrect: true };
    const raw = JSON.stringify([result]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctHan).toBe(13);
  });

  // --- エラー系: 入力全体が不正 ---

  it("undefined を渡すと空配列を返す", () => {
    const results = parseHanCountResults(undefined);
    expect(results).toEqual([]);
  });

  it("空文字列は空配列を返す", () => {
    const results = parseHanCountResults("");
    expect(results).toEqual([]);
  });

  it("不正な JSON 文字列は空配列を返す", () => {
    const results = parseHanCountResults("not-json");
    expect(results).toEqual([]);
  });

  it("配列でない JSON（オブジェクト）は空配列を返す", () => {
    const results = parseHanCountResults(JSON.stringify({ foo: "bar" }));
    expect(results).toEqual([]);
  });

  it("文字列の JSON は空配列を返す", () => {
    const results = parseHanCountResults(JSON.stringify("hello"));
    expect(results).toEqual([]);
  });

  it("数値の JSON は空配列を返す", () => {
    const results = parseHanCountResults(JSON.stringify(42));
    expect(results).toEqual([]);
  });

  // --- 不正データフィルタリング: 必須フィールドの欠損 ---

  it("correctHan が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "correctHan");
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("userHan が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "userHan");
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("isCorrect が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isCorrect");
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  // --- 不正データフィルタリング: 型の不一致 ---

  it("correctHan が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, correctHan: "3" };
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("userHan が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, userHan: "3" };
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  it("isCorrect が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, isCorrect: "true" };
    const raw = JSON.stringify([invalid]);
    const results = parseHanCountResults(raw);
    expect(results).toEqual([]);
  });

  // --- 不正データフィルタリング: 配列要素が不正な型 ---

  it("null 要素はフィルタされる", () => {
    const raw = JSON.stringify([null, validResult]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("数値要素はフィルタされる", () => {
    const raw = JSON.stringify([42, validResult]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("文字列要素はフィルタされる", () => {
    const raw = JSON.stringify(["invalid", validResult]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  // --- 混在データ ---

  it("有効な要素と無効な要素が混在する場合、有効な要素のみ返す", () => {
    const invalidMissingField = { ...validResult };
    Reflect.deleteProperty(invalidMissingField, "correctHan");
    const invalidWrongType = { ...validResult, userHan: "3" };

    const raw = JSON.stringify([
      validResult,
      invalidMissingField,
      invalidWrongType,
      null,
      { correctHan: 1, userHan: 2, isCorrect: false },
    ]);
    const results = parseHanCountResults(raw);
    expect(results).toHaveLength(2);
    expect(results[0]).toEqual(validResult);
    expect(results[1]).toEqual({ correctHan: 1, userHan: 2, isCorrect: false });
  });

  // --- 出題スナップショット ---

  describe("question スナップショット", () => {
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
        { name: "\u7acb\u76f4", han: 1 },
        { name: "\u30c9\u30e9", han: 2 },
      ],
    };

    it("\u30b9\u30ca\u30c3\u30d7\u30b7\u30e7\u30c3\u30c8\u4ed8\u304d\u306e\u7d50\u679c\u3092\u30d1\u30fc\u30b9\u3067\u304d\u308b", () => {
      const raw = JSON.stringify([{ ...validResult, question: validSnapshot }]);
      const results = parseHanCountResults(raw);
      expect(results).toHaveLength(1);
      expect(results[0]?.question).toEqual(validSnapshot);
    });

    it("\u30b9\u30ca\u30c3\u30d7\u30b7\u30e7\u30c3\u30c8\u3092\u6301\u305f\u306a\u3044\u65e7\u30c7\u30fc\u30bf\u3082\u30d1\u30fc\u30b9\u3067\u304d\u308b", () => {
      const results = parseHanCountResults(JSON.stringify([validResult]));
      expect(results).toHaveLength(1);
      expect(results[0]?.question).toBeUndefined();
    });

    it("isTsumo \u3092\u6b20\u304f\u30b9\u30ca\u30c3\u30d7\u30b7\u30e7\u30c3\u30c8\u3092\u6301\u3064\u8981\u7d20\u306f\u30d5\u30a3\u30eb\u30bf\u3055\u308c\u308b", () => {
      const question = { ...validSnapshot };
      Reflect.deleteProperty(question, "isTsumo");
      const raw = JSON.stringify([{ ...validResult, question }]);
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("yakuDetails \u3092\u6b20\u304f\u30b9\u30ca\u30c3\u30d7\u30b7\u30e7\u30c3\u30c8\u3092\u6301\u3064\u8981\u7d20\u306f\u30d5\u30a3\u30eb\u30bf\u3055\u308c\u308b", () => {
      const question = { ...validSnapshot };
      Reflect.deleteProperty(question, "yakuDetails");
      const raw = JSON.stringify([{ ...validResult, question }]);
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("yakuDetails \u306e\u7ffb\u6570\u304c\u6570\u5024\u3067\u306a\u3044\u8981\u7d20\u306f\u30d5\u30a3\u30eb\u30bf\u3055\u308c\u308b", () => {
      const question = {
        ...validSnapshot,
        yakuDetails: [{ name: "\u7acb\u76f4", han: "1" }],
      };
      const raw = JSON.stringify([{ ...validResult, question }]);
      expect(parseHanCountResults(raw)).toEqual([]);
    });

    it("\u624b\u724c\u304c\u6587\u5b57\u5217\u3067\u306a\u3044\u30b9\u30ca\u30c3\u30d7\u30b7\u30e7\u30c3\u30c8\u3092\u6301\u3064\u8981\u7d20\u306f\u30d5\u30a3\u30eb\u30bf\u3055\u308c\u308b", () => {
      const question = { ...validSnapshot, tehai: 42 };
      const raw = JSON.stringify([{ ...validResult, question }]);
      expect(parseHanCountResults(raw)).toEqual([]);
    });
  });
});

/**
 * \u7ffb\u6570\u5373\u7b54\u306e\u51fa\u984c\u3092\u7d44\u307f\u7acb\u3066\u308b
 *
 * `buildDemoScoreQuestion` \u306f\u63cf\u753b\u7528\u306e\u30c7\u30e2\u51fa\u984c\u3067 `answer` \u3092\u6301\u305f\u306a\u3044\u305f\u3081\u3001
 * \u7ffb\u6570\u3068\u5f79\u306e\u5185\u8a33\u3092\u3053\u3053\u3067\u8db3\u3059\u3002
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
  } as unknown as ScoreQuestion;
}

describe("toHanCountQuestionResult", () => {
  it("\u51fa\u984c\u3068\u56de\u7b54\u304b\u3089\u7d50\u679c\u3092\u7d44\u307f\u7acb\u3066\u308b", () => {
    const question = buildQuestion(3, [
      { name: "\u5e73\u548c", han: 1 },
      { name: "\u30c9\u30e9", han: 2 },
    ]);
    const result = toHanCountQuestionResult(question, 3);

    expect(result.correctHan).toBe(3);
    expect(result.userHan).toBe(3);
    expect(result.isCorrect).toBe(true);
    expect(result.question?.isTsumo).toBe(true);
    expect(result.question?.yakuDetails).toEqual([
      { name: "\u5e73\u548c", han: 1 },
      { name: "\u30c9\u30e9", han: 2 },
    ]);
  });

  it("\u8aa4\u7b54\u3092 isCorrect=false \u3068\u3057\u3066\u8a18\u9332\u3059\u308b", () => {
    const question = buildQuestion(3, [{ name: "\u5e73\u548c", han: 3 }]);
    expect(toHanCountQuestionResult(question, 2).isCorrect).toBe(false);
  });

  it("13\u7ffb\u4ee5\u4e0a\u306e\u6b63\u89e3\u306f\u5f79\u6e80\uff0813\u7ffb\uff09\u306b\u4e38\u3081\u3066\u5224\u5b9a\u3059\u308b", () => {
    const question = buildQuestion(16, [
      { name: "\u56db\u6697\u523b", han: 13 },
      { name: "\u30c9\u30e9", han: 3 },
    ]);
    const result = toHanCountQuestionResult(question, 13);

    expect(result.correctHan).toBe(13);
    expect(result.isCorrect).toBe(true);
    // \u4e38\u3081\u524d\u306e\u7ffb\u6570\u306f\u5185\u8a33\u306e\u5408\u8a08\u3068\u3057\u3066\u6b8b\u308b
    expect(
      result.question?.yakuDetails.reduce((sum, d) => sum + d.han, 0),
    ).toBe(16);
  });

  it("\u7d44\u307f\u7acb\u3066\u305f\u7d50\u679c\u306f\u30d1\u30fc\u30b5\u30fc\u306e\u30d0\u30ea\u30c7\u30fc\u30b7\u30e7\u30f3\u3092\u901a\u904e\u3059\u308b", () => {
    const question = buildQuestion(2, [{ name: "\u65ad\u5e7a\u4e5d", han: 2 }]);
    const raw = JSON.stringify([toHanCountQuestionResult(question, 2)]);
    const results = parseHanCountResults(raw);

    expect(results).toHaveLength(1);
    expect(results[0]?.question?.tehai).toBe("234567m345p55678s");
  });
});
