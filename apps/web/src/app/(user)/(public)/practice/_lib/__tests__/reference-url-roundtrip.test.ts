import { describe, expect, it } from "vitest";
import { makeScoreQuestionResult } from "./score-question-result.fixture";

import type { ScoreQuestionResult } from "../score-question-result";
import { buildReferenceUrl } from "../build-reference-url";
import {
  parseScoreTableFocusFromParams,
  resolveScoreTableFocus,
} from "../../../reference/score-table/_lib/score-table-utils";
import type { ScoreTableFocusTarget } from "../../../reference/score-table/_lib/score-table-utils";

/**
 * buildReferenceUrl で生成されたURLのクエリパラメータが、
 * ScoreTable のハイライトロジックで正しく対象セル（または満貫以上の
 * 区分行）に解決されることを検証する。
 * URL生成 → クエリパラメータ解析 → ハイライト対象の一貫性テスト。
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

function resolveFromUrl(url: string): ScoreTableFocusTarget {
  return resolveScoreTableFocus(
    parseScoreTableFocusFromParams(extractParams(url)),
  );
}

describe("buildReferenceUrl → ScoreTable highlight roundtrip", () => {
  const normalCases: {
    name: string;
    input: Partial<ScoreQuestionResult>;
    expected: ScoreTableFocusTarget;
  }[] = [
    {
      name: "子・ロン・1翻30符",
      input: { isOya: false, isTsumo: false, han: 1, fu: 30 },
      expected: {
        viewMode: "normal",
        normalCell: { han: 1, fu: 30 },
        highScoreKey: undefined,
      },
    },
    {
      name: "親・ロン・2翻40符",
      input: { isOya: true, isTsumo: false, han: 2, fu: 40 },
      expected: {
        viewMode: "normal",
        normalCell: { han: 2, fu: 40 },
        highScoreKey: undefined,
      },
    },
    {
      name: "子・ツモ・3翻30符",
      input: { isOya: false, isTsumo: true, han: 3, fu: 30 },
      expected: {
        viewMode: "normal",
        normalCell: { han: 3, fu: 30 },
        highScoreKey: undefined,
      },
    },
    {
      name: "親・ツモ・4翻25符",
      input: { isOya: true, isTsumo: true, han: 4, fu: 25 },
      expected: {
        viewMode: "normal",
        normalCell: { han: 4, fu: 25 },
        highScoreKey: undefined,
      },
    },
    {
      name: "子・ロン・1翻110符",
      input: { isOya: false, isTsumo: false, han: 1, fu: 110 },
      expected: {
        viewMode: "normal",
        normalCell: { han: 1, fu: 110 },
        highScoreKey: undefined,
      },
    },
  ];

  for (const { name, input, expected } of normalCases) {
    it(`${name} のURL → ハイライト対象が一致する`, () => {
      const url = buildReferenceUrl(makeScoreQuestionResult(input));
      expect(resolveFromUrl(url)).toEqual(expected);
    });
  }

  it("満貫以上（fu なしURL）→ 満貫以上の表の区分行に解決される", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({
        isOya: false,
        isTsumo: false,
        han: 6,
        fu: undefined,
      }),
    );
    expect(extractParams(url).fu).toBeNull();
    expect(resolveFromUrl(url)).toEqual({
      viewMode: "high_score",
      normalCell: undefined,
      highScoreKey: "haneman",
    });
  });
});
