import { describe, expect, it } from "vitest";
import { makeScoreQuestionResult } from "./score-question-result.fixture";

import { buildReferenceUrl } from "../build-reference-url";

describe("buildReferenceUrl", () => {
  it("子・ロンの場合 role=ko&winType=ron を含む", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({ isOya: false, isTsumo: false }),
    );
    expect(url).toBe("/reference/score-table?role=ko&winType=ron&han=1&fu=30");
  });

  it("親・ロンの場合 role=oya&winType=ron を含む", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({ isOya: true, isTsumo: false }),
    );
    expect(url).toBe("/reference/score-table?role=oya&winType=ron&han=1&fu=30");
  });

  it("子・ツモの場合 role=ko&winType=tsumo を含む", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({ isOya: false, isTsumo: true }),
    );
    expect(url).toBe(
      "/reference/score-table?role=ko&winType=tsumo&han=1&fu=30",
    );
  });

  it("親・ツモの場合 role=oya&winType=tsumo を含む", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({ isOya: true, isTsumo: true }),
    );
    expect(url).toBe(
      "/reference/score-table?role=oya&winType=tsumo&han=1&fu=30",
    );
  });

  it("翻数と符が正しくURLに含まれる", () => {
    const url = buildReferenceUrl(makeScoreQuestionResult({ han: 3, fu: 40 }));
    expect(url).toContain("han=3");
    expect(url).toContain("fu=40");
  });

  it("4翻110符のケース", () => {
    const url = buildReferenceUrl(
      makeScoreQuestionResult({ han: 4, fu: 110, isOya: true, isTsumo: true }),
    );
    expect(url).toBe(
      "/reference/score-table?role=oya&winType=tsumo&han=4&fu=110",
    );
  });

  it("パスは /reference/score-table で始まる", () => {
    const url = buildReferenceUrl(makeScoreQuestionResult());
    expect(url).toMatch(/^\/reference\/score-table\?/);
  });

  it("全4パラメータが含まれる", () => {
    const url = buildReferenceUrl(makeScoreQuestionResult());
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.has("role")).toBe(true);
    expect(params.has("winType")).toBe(true);
    expect(params.has("han")).toBe(true);
    expect(params.has("fu")).toBe(true);
  });
});
