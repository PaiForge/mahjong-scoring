import { describe, expect, it } from "vitest";
import { MentsuType, generateMentsuFuQuestion } from "@mahjong-scoring/core";

import { restoreMentsu } from "../../../_lib/mentsu-serialization";
import { parseMentsuFuResults, toQuestionResult } from "../types";

/** 保存形式として妥当な結果データ */
const validResult = {
  mentsu: {
    tiles: "111m",
    type: MentsuType.Koutsu,
    furo: { type: "Pon", from: 2 },
  },
  correctFu: 4,
  userFu: 8,
  isCorrect: false,
};

describe("parseMentsuFuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseMentsuFuResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("undefined と壊れた JSON は空配列を返す", () => {
    expect(parseMentsuFuResults(undefined)).toEqual([]);
    expect(parseMentsuFuResults("{")).toEqual([]);
  });

  it("mentsu を欠く要素は除外する", () => {
    const { mentsu: _omitted, ...broken } = validResult;
    expect(parseMentsuFuResults(JSON.stringify([broken]))).toEqual([]);
  });

  it("完成面子でない種別を持つ要素は除外する", () => {
    const broken = {
      ...validResult,
      mentsu: { ...validResult.mentsu, type: "Toitsu" },
    };
    expect(parseMentsuFuResults(JSON.stringify([broken]))).toEqual([]);
  });

  it("furo の形が違う要素は除外する", () => {
    const broken = {
      ...validResult,
      mentsu: { ...validResult.mentsu, furo: { type: "Pon" } },
    };
    expect(parseMentsuFuResults(JSON.stringify([broken]))).toEqual([]);
  });
});

describe("toQuestionResult", () => {
  it("正解の符と一致すれば正解として記録する", () => {
    const question = generateMentsuFuQuestion();
    const result = toQuestionResult(question, question.answer);

    expect(result.isCorrect).toBe(true);
    expect(result.correctFu).toBe(question.answer);
    expect(parseMentsuFuResults(JSON.stringify([result]))).toHaveLength(1);
  });

  it("保存形式から出題された面子を復元できる", () => {
    // 結果ページはこの復元に依存して面子を再表示する。
    const question = generateMentsuFuQuestion();
    const result = toQuestionResult(question, 0);

    const mentsu = restoreMentsu(result.mentsu);
    expect(mentsu?.type).toBe(question.mentsu.type);
    expect(mentsu?.hais).toEqual(
      [...question.mentsu.hais].sort((a, b) => a - b),
    );
    expect(mentsu?.furo).toEqual(question.mentsu.furo);
  });
});
