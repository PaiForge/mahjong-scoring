import { describe, expect, it } from "vitest";
import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import {
  buildScorePracticeQuery,
  type ScorePracticeQueryInput,
} from "../build-practice-query";
import {
  parseGeneratorOptionsFromParams,
  parseModeFlagsFromParams,
} from "../parse-practice-params";

const BASE: ScorePracticeQueryInput = {
  requireYaku: false,
  requireHanFu: true,
  exactHan: false,
  requireFuForMangan: false,
  measureTime: false,
  targetScoreRanges: ["nonMangan", "manganPlus"],
  includeParent: true,
  includeChild: true,
  targetYaku: [],
};
const PRO = { hasPracticeTools: true, includeYakuFilter: true };

function roundTrip(input: ScorePracticeQueryInput, options = PRO) {
  const params = new URLSearchParams(buildScorePracticeQuery(input, options));
  return {
    flags: parseModeFlagsFromParams(params),
    generator: parseGeneratorOptionsFromParams(params),
  };
}

describe("buildScorePracticeQuery", () => {
  it("既定の設定は読む側の既定に戻る", () => {
    const { flags, generator } = roundTrip(BASE);
    expect(flags).toMatchObject({
      requireYaku: false,
      requireHanFu: true,
      exactHan: false,
      requireFuForMangan: false,
      measureTime: false,
    });
    expect(generator.allowedRanges).toEqual(["nonMangan", "manganPlus"]);
    expect(generator.includeParent).toBe(true);
    expect(generator.includeChild).toBe(true);
  });

  it("翻数と符を答えないときは 5翻以上の答え方と満貫以上の符を落とす", () => {
    const { flags } = roundTrip({
      ...BASE,
      requireHanFu: false,
      exactHan: true,
      requireFuForMangan: true,
    });
    expect(flags.exactHan).toBe(false);
    expect(flags.requireFuForMangan).toBe(false);
  });

  it("回答時間の計測は Pro のときだけ載せる", () => {
    const input = { ...BASE, measureTime: true };
    expect(roundTrip(input).flags.measureTime).toBe(true);
    expect(
      roundTrip(input, { ...PRO, hasPracticeTools: false }).flags.measureTime,
    ).toBe(false);
  });

  it("点数帯は片方だけ選んだときに載せ、親子はそれぞれ載せる", () => {
    const { generator } = roundTrip({
      ...BASE,
      targetScoreRanges: ["manganPlus"],
      includeParent: false,
    });
    expect(generator.allowedRanges).toEqual(["manganPlus"]);
    expect(generator.includeParent).toBe(false);
    expect(generator.includeChild).toBe(true);
  });

  it("役の絞り込みは聴牌形の点数計算では載せない", () => {
    const input = { ...BASE, targetYaku: [SCORE_FILTERABLE_YAKU[0]] };
    expect(buildScorePracticeQuery(input, PRO)).toContain("yaku=");
    expect(
      buildScorePracticeQuery(input, { ...PRO, includeYakuFilter: false }),
    ).not.toContain("yaku=");
  });
});
