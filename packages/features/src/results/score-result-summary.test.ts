import { describe, expect, it } from "vitest";

import { makeScoreQuestionResult } from "./score-question-result.fixture";
import { scoreResultSummary } from "./score-question-result";

/** 辞書の代わり */
const t = (key: string, values?: Record<string, number>) =>
  ({
    oya: "親",
    ko: "子",
    tsumo: "ツモ",
    ron: "ロン",
    fu: `${values?.count}符`,
    han: `${values?.count}翻`,
  })[key] ?? key;

describe("scoreResultSummary", () => {
  it("親子・ロンツモ・符翻を表示順の設定どおりに並べる", () => {
    const result = makeScoreQuestionResult({ han: 2, fu: 30 });
    expect(scoreResultSummary(result, t, "fu-first")).toBe(
      "子・ロン・30符・2翻",
    );
    expect(scoreResultSummary(result, t, "han-first")).toBe(
      "子・ロン・2翻・30符",
    );
  });

  it("満貫以上で符を持たない問題は符を省く", () => {
    const result = makeScoreQuestionResult({
      isOya: true,
      isTsumo: true,
      han: 5,
      fu: undefined,
    });
    expect(scoreResultSummary(result, t, "fu-first")).toBe("親・ツモ・5翻");
  });
});
