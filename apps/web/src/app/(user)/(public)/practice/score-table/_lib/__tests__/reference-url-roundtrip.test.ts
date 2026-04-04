import { describe, expect, it } from "vitest";

import type { ScoreTableQuestionResult } from "../types";
import { buildReferenceUrl } from "../build-reference-url";
import { buildHighlightCellId } from "../../../../reference/_lib/score-table-utils";

/**
 * buildReferenceUrl で生成されたURLのクエリパラメータが、
 * ScoreTable のハイライトロジックで正しくセルIDに変換されることを検証する。
 * URL生成 → クエリパラメータ解析 → セルIDの一貫性テスト。
 */

function extractParams(url: string) {
  const params = new URLSearchParams(url.split("?")[1]);
  return {
    role: params.get("role"),
    winType: params.get("winType"),
    han: params.get("han"),
    fu: params.get("fu"),
  };
}

function makeResult(
  overrides: Partial<ScoreTableQuestionResult> = {},
): ScoreTableQuestionResult {
  return {
    isOya: false,
    isTsumo: false,
    han: 1,
    fu: 30,
    correctAnswer: { type: "ron", score: 1000 },
    userAnswer: { type: "ron", score: 1000 },
    isCorrect: true,
    ...overrides,
  };
}

describe("buildReferenceUrl → ScoreTable highlight roundtrip", () => {
  const cases: {
    name: string;
    input: Partial<ScoreTableQuestionResult>;
    expectedCellId: string;
  }[] = [
    {
      name: "子・ロン・1翻30符",
      input: { isOya: false, isTsumo: false, han: 1, fu: 30 },
      expectedCellId: "ko-ron-1han-30fu",
    },
    {
      name: "親・ロン・2翻40符",
      input: { isOya: true, isTsumo: false, han: 2, fu: 40 },
      expectedCellId: "oya-ron-2han-40fu",
    },
    {
      name: "子・ツモ・3翻30符",
      input: { isOya: false, isTsumo: true, han: 3, fu: 30 },
      expectedCellId: "ko-tsumo-3han-30fu",
    },
    {
      name: "親・ツモ・4翻25符",
      input: { isOya: true, isTsumo: true, han: 4, fu: 25 },
      expectedCellId: "oya-tsumo-4han-25fu",
    },
    {
      name: "子・ロン・1翻110符",
      input: { isOya: false, isTsumo: false, han: 1, fu: 110 },
      expectedCellId: "ko-ron-1han-110fu",
    },
  ];

  for (const { name, input, expectedCellId } of cases) {
    it(`${name} のURL → ハイライトセルIDが一致する`, () => {
      const url = buildReferenceUrl(makeResult(input));
      const params = extractParams(url);
      const cellId = buildHighlightCellId(params);
      expect(cellId).toBe(expectedCellId);
    });
  }
});
