import { describe, expect, it } from "vitest";

import { parseQuestionResults } from "../score-question-result";

describe("parseQuestionResults", () => {
  const validResult = {
    isOya: true,
    isTsumo: false,
    han: 3,
    fu: 40,
    correctAnswer: { type: "ron", score: 7700 },
    userAnswer: { type: "ron", score: 7700 },
    isCorrect: true,
  };

  it("有効な JSON 文字列をパースできる", () => {
    const raw = JSON.stringify([validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("複数件の結果をパースできる", () => {
    const koTsumoResult = {
      isOya: false,
      isTsumo: true,
      han: 2,
      fu: 30,
      correctAnswer: { type: "koTsumo", scoreFromKo: 1000, scoreFromOya: 2000 },
      userAnswer: { type: "koTsumo", scoreFromKo: 1000, scoreFromOya: 2000 },
      isCorrect: true,
    };
    const raw = JSON.stringify([validResult, koTsumoResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(2);
  });

  it("oyaTsumo タイプの回答を含む結果をパースできる", () => {
    const oyaTsumoResult = {
      isOya: true,
      isTsumo: true,
      han: 3,
      fu: 30,
      correctAnswer: { type: "oyaTsumo", scoreAll: 4000 },
      userAnswer: { type: "oyaTsumo", scoreAll: 4000 },
      isCorrect: true,
    };
    const raw = JSON.stringify([oyaTsumoResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]?.correctAnswer.type).toBe("oyaTsumo");
  });

  it("undefined を渡すと空配列を返す", () => {
    const results = parseQuestionResults(undefined);
    expect(results).toEqual([]);
  });

  it("空配列の JSON 文字列は空配列を返す", () => {
    const results = parseQuestionResults("[]");
    expect(results).toEqual([]);
  });

  it("不正な JSON 文字列は空配列を返す", () => {
    const results = parseQuestionResults("not-json");
    expect(results).toEqual([]);
  });

  it("配列でない JSON は空配列を返す", () => {
    const results = parseQuestionResults(JSON.stringify({ foo: "bar" }));
    expect(results).toEqual([]);
  });

  it("文字列の JSON は空配列を返す", () => {
    const results = parseQuestionResults(JSON.stringify("hello"));
    expect(results).toEqual([]);
  });

  it("isOya が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isOya");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isTsumo が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isTsumo");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("han が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("fu が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "fu");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isCorrect が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "isCorrect");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("correctAnswer が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "correctAnswer");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer が欠落した要素はフィルタされる", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "userAnswer");
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("correctAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      correctAnswer: { type: "invalid", score: 1000 },
    };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("userAnswer の type が不正な要素はフィルタされる", () => {
    const invalid = {
      ...validResult,
      userAnswer: { type: "unknown", score: 1000 },
    };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("有効な要素と無効な要素が混在する場合、有効な要素のみ返す", () => {
    const invalid = { ...validResult };
    Reflect.deleteProperty(invalid, "han");
    const raw = JSON.stringify([validResult, invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("han が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, han: "3" };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("isOya が文字列の場合はフィルタされる", () => {
    const invalid = { ...validResult, isOya: "true" };
    const raw = JSON.stringify([invalid]);
    const results = parseQuestionResults(raw);
    expect(results).toEqual([]);
  });

  it("null 要素はフィルタされる", () => {
    const raw = JSON.stringify([null, validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
  });

  it("数値要素はフィルタされる", () => {
    const raw = JSON.stringify([42, validResult]);
    const results = parseQuestionResults(raw);
    expect(results).toHaveLength(1);
  });
});
