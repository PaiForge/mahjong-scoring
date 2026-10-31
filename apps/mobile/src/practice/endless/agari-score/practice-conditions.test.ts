import { describe, expect, it } from "vitest";

import {
  readGeneratorOptions,
  type ScoreSettingsValues,
} from "./practice-conditions";

/** 絞り込みを掛けた設定（章の絞り込みがこれを読まないことを確かめる） */
const NARROWED: ScoreSettingsValues = {
  requireYaku: false,
  requireHanFu: false,
  exactHan: false,
  requireFuForMangan: false,
  targetScoreRanges: ["manganPlus"],
  targetYaku: ["立直"],
  includeParent: false,
  includeChild: true,
};

describe("readGeneratorOptions", () => {
  it("設定の点数帯・親子・役で出題する", () => {
    expect(readGeneratorOptions(NARROWED, true)).toMatchObject({
      allowedRanges: ["manganPlus"],
      includeParent: false,
      includeChild: true,
      requiredYaku: ["立直"],
    });
  });

  it("章の絞り込みがあれば設定を読まずにそれで出題する", () => {
    expect(
      readGeneratorOptions(NARROWED, true, {
        yaku: ["平和"],
        ranges: ["nonMangan"],
      }),
    ).toEqual({
      allowedRanges: ["nonMangan"],
      includeParent: true,
      includeChild: true,
      includeFuro: true,
      requireFuro: false,
      requiredYaku: ["平和"],
    });
  });

  it("章の絞り込みの手の形を通し、省略した軸は絞り込まない", () => {
    expect(readGeneratorOptions(NARROWED, true, { handShape: "furo" })).toEqual(
      {
        allowedRanges: ["nonMangan", "manganPlus"],
        includeParent: true,
        includeChild: true,
        includeFuro: true,
        requireFuro: true,
        requiredYaku: undefined,
      },
    );
  });
});
