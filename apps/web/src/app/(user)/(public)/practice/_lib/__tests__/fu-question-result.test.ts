import { describe, expect, it } from "vitest";
import {
  generateTotalFuQuestion,
  parseHais,
  parseKazehai,
  parseTehai,
} from "@mahjong-scoring/core";

import { generateOrThrow } from "@/test/generate-or-throw";

import { QUESTION_GENERATION_MAX_RETRIES } from "../../total-fu/_lib/types";

import {
  parseFuQuestionResults,
  toFuQuestionResult,
} from "../fu-question-result";

/** 保存形式として妥当な結果データ */
const validResult = {
  tehai: "234m67888s[234s][678m]",
  agariHai: "2m",
  bakaze: "2z",
  jikaze: "1z",
  isTsumo: true,
  correctFu: 30,
  userFu: 20,
  isCorrect: false,
  fuDetails: [
    { reason: "副底", fu: 20 },
    { reason: "ツモ", fu: 2 },
  ],
};

describe("parseFuQuestionResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseFuQuestionResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("空配列の JSON 文字列は空配列を返す", () => {
    expect(parseFuQuestionResults("[]")).toEqual([]);
  });

  it("undefined は空配列を返す", () => {
    expect(parseFuQuestionResults(undefined)).toEqual([]);
  });

  it("壊れた JSON は空配列を返す", () => {
    expect(parseFuQuestionResults("{")).toEqual([]);
  });

  it("必須フィールドを欠く要素は除外する", () => {
    const { correctFu: _omitted, ...missingFu } = validResult;
    const raw = JSON.stringify([validResult, missingFu]);
    expect(parseFuQuestionResults(raw)).toHaveLength(1);
  });

  it("fuDetails の形が違う要素は除外する", () => {
    const broken = { ...validResult, fuDetails: [{ reason: "副底" }] };
    expect(parseFuQuestionResults(JSON.stringify([broken]))).toEqual([]);
  });
});

describe("toFuQuestionResult", () => {
  /** 生成できるまで試す（牌の残数不足で undefined を返しうるため） */
  function generate() {
    return generateOrThrow(
      generateTotalFuQuestion,
      QUESTION_GENERATION_MAX_RETRIES,
    );
  }

  it("出題を保存形式に変換し、パースを通過する", () => {
    const question = generate();
    const result = toFuQuestionResult(question, question.answer);

    expect(result.isCorrect).toBe(true);
    expect(result.correctFu).toBe(question.answer);

    const parsed = parseFuQuestionResults(JSON.stringify([result]));
    expect(parsed).toHaveLength(1);
  });

  it("保存形式から出題内容（手牌・風・和了牌）を復元できる", () => {
    // 結果ページはこの復元に依存して手牌を再表示する。
    const question = generate();
    const result = toFuQuestionResult(question, 20);

    const tehai = parseTehai(result.tehai);
    expect(tehai).toBeDefined();
    expect(tehai?.closed.length).toBe(question.tehai.closed.length);
    expect(tehai?.exposed.length).toBe(question.tehai.exposed.length);

    expect(parseKazehai(result.bakaze)).toBe(question.context.bakaze);
    expect(parseKazehai(result.jikaze)).toBe(question.context.jikaze);
    expect(parseHais(result.agariHai)[0]).toBe(question.context.agariHai);
  });

  it("正解と異なる符を渡すと不正解として記録する", () => {
    const question = generate();
    const wrongFu = question.answer === 20 ? 110 : 20;
    const result = toFuQuestionResult(question, wrongFu);

    expect(result.isCorrect).toBe(false);
    expect(result.userFu).toBe(wrongFu);
  });
});
