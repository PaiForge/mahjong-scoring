import { describe, expect, it } from "vitest";

import { parseHanCountResults } from "../types";

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
});
