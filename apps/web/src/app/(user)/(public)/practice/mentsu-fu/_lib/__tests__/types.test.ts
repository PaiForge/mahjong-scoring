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
  outcome: "incorrect",
};

describe("parseMentsuFuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseMentsuFuResults([validResult]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("完成面子でない種別を持つ要素は除外する", () => {
    const broken = {
      ...validResult,
      mentsu: { ...validResult.mentsu, type: "Toitsu" },
    };
    expect(parseMentsuFuResults([broken])).toEqual([]);
  });

  it("furo の形が違う要素は除外する", () => {
    const broken = {
      ...validResult,
      mentsu: { ...validResult.mentsu, furo: { type: "Pon" } },
    };
    expect(parseMentsuFuResults([broken])).toEqual([]);
  });
});

describe("toQuestionResult", () => {
  it("正解の符と一致すれば正解として記録する", () => {
    const question = generateMentsuFuQuestion();
    const result = toQuestionResult(question, question.answer);

    expect(result.outcome).toBe("correct");
    expect(result.correctFu).toBe(question.answer);
    expect(parseMentsuFuResults([result])).toHaveLength(1);
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

  it("回答なし（時間切れ）は outcome=timeUp で記録し、パースを通過する", () => {
    const question = generateMentsuFuQuestion();
    const result = toQuestionResult(question, undefined);

    expect(result.outcome).toBe("timeUp");
    expect(result.userFu).toBeUndefined();
    expect(parseMentsuFuResults([result])).toHaveLength(1);
  });
});
