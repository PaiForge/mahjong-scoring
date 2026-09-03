import { describe, expect, it } from "vitest";
import {
  generateJantouFuQuestion,
  parseHais,
  parseKazehai,
} from "@mahjong-scoring/core";

import { parseJantouFuResults, toQuestionResult } from "../types";

/** 保存形式として妥当な結果データ */
const validResult = {
  bakaze: "1z",
  jikaze: "2z",
  correctHai: "2z",
  correctFu: 2,
  selectedHai: "5m",
  selectedFu: 0,
  isCorrect: false,
};

describe("parseJantouFuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseJantouFuResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });
});

describe("toQuestionResult", () => {
  it("正解の選択肢を選べば正解として記録する", () => {
    const question = generateJantouFuQuestion();
    const correct = question.choices.find((c) => c.isCorrect);
    if (!correct) throw new Error("正解の選択肢が無い");

    const result = toQuestionResult(question, correct);

    expect(result.isCorrect).toBe(true);
    expect(result.selectedHai).toBe(result.correctHai);
    expect(parseJantouFuResults(JSON.stringify([result]))).toHaveLength(1);
  });

  it("誤答でも正解の雀頭とその符を残す", () => {
    // 結果ページはこれを使って「正解はどの牌だったか」を見せる。
    const question = generateJantouFuQuestion();
    const wrong = question.choices.find((c) => !c.isCorrect);
    const correct = question.choices.find((c) => c.isCorrect);
    if (!wrong || !correct) throw new Error("選択肢が揃っていない");

    const result = toQuestionResult(question, wrong);

    expect(result.isCorrect).toBe(false);
    expect(parseHais(result.correctHai)[0]).toBe(correct.hai);
    expect(result.correctFu).toBe(correct.fu);
    expect(parseHais(result.selectedHai)[0]).toBe(wrong.hai);
    expect(result.selectedFu).toBe(wrong.fu);
  });

  it("出題時の場風・自風を復元できる", () => {
    // 同じ牌でも風しだいで符が変わるため、風が無いと符を読み解けない。
    const question = generateJantouFuQuestion();
    const result = toQuestionResult(question, question.choices[0]);

    expect(parseKazehai(result.bakaze)).toBe(question.context.bakaze);
    expect(parseKazehai(result.jikaze)).toBe(question.context.jikaze);
  });
});
