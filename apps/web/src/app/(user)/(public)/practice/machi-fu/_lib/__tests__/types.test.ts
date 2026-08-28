import { describe, expect, it } from "vitest";
import { generateMachiFuQuestion, parseHais } from "@mahjong-scoring/core";

import { parseMachiFuResults, toQuestionResult } from "../types";

/** 保存形式として妥当な結果データ */
const validResult = {
  tiles: "46m",
  agariHai: "5m",
  correctFu: 2,
  userFu: 0,
  isCorrect: false,
};

describe("parseMachiFuResults", () => {
  it("有効な JSON 文字列をパースできる", () => {
    const results = parseMachiFuResults(JSON.stringify([validResult]));
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(validResult);
  });

  it("undefined と壊れた JSON は空配列を返す", () => {
    expect(parseMachiFuResults(undefined)).toEqual([]);
    expect(parseMachiFuResults("{")).toEqual([]);
  });

  it("必須フィールドを欠く要素は除外する", () => {
    const { agariHai: _omitted, ...broken } = validResult;
    const raw = JSON.stringify([validResult, broken]);
    expect(parseMachiFuResults(raw)).toHaveLength(1);
  });
});

describe("toQuestionResult", () => {
  it("正解の符と一致すれば正解として記録する", () => {
    const question = generateMachiFuQuestion();
    const result = toQuestionResult(question, question.answer);

    expect(result.isCorrect).toBe(true);
    expect(parseMachiFuResults(JSON.stringify([result]))).toHaveLength(1);
  });

  it("保存形式から待ち形と和了牌を出題時の並びのまま復元できる", () => {
    // 結果ページはこの復元に依存して待ち形を再表示する。
    // 待ち形の牌は昇順で出題されるため、MSPZ の正規化を通しても並びが変わらない。
    for (let i = 0; i < 50; i++) {
      const question = generateMachiFuQuestion();
      const result = toQuestionResult(question, 0);

      expect(parseHais(result.tiles)).toEqual([...question.tiles]);
      expect(parseHais(result.agariHai)[0]).toBe(question.agariHai);
    }
  });
});
