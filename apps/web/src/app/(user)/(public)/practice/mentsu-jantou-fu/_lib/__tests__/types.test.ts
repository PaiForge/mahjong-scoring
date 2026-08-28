import { describe, expect, it } from "vitest";
import {
  MentsuType,
  generateMentsuJantouFuQuestion,
  parseHais,
  parseKazehai,
  parseTehai,
} from "@mahjong-scoring/core";

import { parseMentsuJantouFuResults, toQuestionResult } from "../types";

/** 保存形式として妥当な結果データ */
const validResult = {
  tehai: "11m345p11122s[789m]",
  agariHai: "1m",
  bakaze: "1z",
  jikaze: "2z",
  isTsumo: false,
  items: [
    { tiles: "11m", type: "Pair", isOpen: false, correctFu: 0, userFu: 0 },
    {
      tiles: "345p",
      type: MentsuType.Shuntsu,
      isOpen: false,
      correctFu: 0,
      userFu: 0,
    },
    {
      tiles: "111s",
      type: MentsuType.Koutsu,
      isOpen: false,
      correctFu: 4,
      userFu: 2,
    },
    {
      tiles: "789m",
      type: MentsuType.Shuntsu,
      isOpen: true,
      furo: { type: "Chi", from: 3 },
      correctFu: 0,
      userFu: 0,
    },
  ],
  isCorrect: false,
};

describe("parseMentsuJantouFuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseMentsuJantouFuResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("空配列の JSON 文字列は空配列を返す", () => {
    expect(parseMentsuJantouFuResults("[]")).toEqual([]);
  });

  it("undefined は空配列を返す", () => {
    expect(parseMentsuJantouFuResults(undefined)).toEqual([]);
  });

  it("壊れた JSON は空配列を返す", () => {
    expect(parseMentsuJantouFuResults("{")).toEqual([]);
  });

  it("必須フィールドを欠く要素は除外する", () => {
    const { tehai: _omitted, ...missingTehai } = validResult;
    const raw = JSON.stringify([validResult, missingTehai]);
    expect(parseMentsuJantouFuResults(raw)).toHaveLength(1);
  });

  it("items の形が違う要素は除外する", () => {
    const broken = { ...validResult, items: [{ tiles: "11m" }] };
    expect(parseMentsuJantouFuResults(JSON.stringify([broken]))).toEqual([]);
  });

  it("面子種別として知らない値を持つ要素は除外する", () => {
    const broken = {
      ...validResult,
      items: [{ ...validResult.items[0], type: "Tatsu" }],
    };
    expect(parseMentsuJantouFuResults(JSON.stringify([broken]))).toEqual([]);
  });

  it("furo の形が違う要素は除外する", () => {
    const broken = {
      ...validResult,
      items: [{ ...validResult.items[3], furo: { type: "Chi" } }],
    };
    expect(parseMentsuJantouFuResults(JSON.stringify([broken]))).toEqual([]);
  });
});

describe("toQuestionResult", () => {
  /** 生成できるまで試す（牌の残数不足で undefined を返しうるため） */
  function generate() {
    for (let i = 0; i < 100; i++) {
      const question = generateMentsuJantouFuQuestion();
      if (question) return question;
    }
    throw new Error("問題を生成できなかった");
  }

  /** 出題どおりに全行を答えた場合の回答 */
  function perfectAnswers(question: ReturnType<typeof generate>) {
    return question.items.map((item) => item.fu);
  }

  it("全行正解なら正解として記録し、パースを通過する", () => {
    const question = generate();
    const result = toQuestionResult(question, perfectAnswers(question));

    expect(result.isCorrect).toBe(true);
    expect(result.items).toHaveLength(question.items.length);
    expect(parseMentsuJantouFuResults(JSON.stringify([result]))).toHaveLength(
      1,
    );
  });

  it("1 行でも外すと不正解として記録する", () => {
    const question = generate();
    const answers = perfectAnswers(question);
    answers[0] = answers[0] === 0 ? 8 : 0;

    const result = toQuestionResult(question, answers);

    expect(result.isCorrect).toBe(false);
    expect(result.items[0].userFu).toBe(answers[0]);
    expect(result.items[0].correctFu).toBe(question.items[0].fu);
  });

  it("保存形式から出題内容（手牌・風・和了牌）を復元できる", () => {
    // 結果ページはこの復元に依存して手牌を再表示する。
    const question = generate();
    const result = toQuestionResult(question, perfectAnswers(question));

    const tehai = parseTehai(result.tehai);
    expect(tehai).toBeDefined();
    expect(tehai?.closed.length).toBe(question.tehai.closed.length);
    expect(tehai?.exposed.length).toBe(question.tehai.exposed.length);

    expect(parseKazehai(result.bakaze)).toBe(question.context.bakaze);
    expect(parseKazehai(result.jikaze)).toBe(question.context.jikaze);
    expect(parseHais(result.agariHai)[0]).toBe(question.context.agariHai);
  });

  it("保存形式から回答行の牌・種別・副露を復元できる", () => {
    // 結果ページはこれを使って出題中と同じ体裁で行を描き直す。
    const question = generate();
    const result = toQuestionResult(question, perfectAnswers(question));

    question.items.forEach((item, index) => {
      const saved = result.items[index];
      expect(parseHais(saved.tiles)).toEqual(
        [...item.tiles].sort((a, b) => a - b),
      );
      expect(saved.type).toBe(item.type);
      expect(saved.isOpen).toBe(item.isOpen);
      expect(saved.furo).toEqual(item.originalMentsu?.furo);
    });
  });
});
