import { describe, expect, it } from "vitest";

import { buildScoreGeneratorOptions } from "./generator-options";

const ALL = {
  includeNonMangan: true,
  includeManganPlus: true,
  includeParent: true,
  includeChild: true,
  requiredYaku: [],
  handShape: undefined,
} as const;

describe("buildScoreGeneratorOptions", () => {
  it("絞り込みが無ければ全点数帯・親子・門前と副露を出し、役は明示的に外す", () => {
    expect(buildScoreGeneratorOptions(ALL)).toEqual({
      allowedRanges: ["nonMangan", "manganPlus"],
      includeParent: true,
      includeChild: true,
      includeFuro: true,
      requireFuro: false,
      requiredYaku: undefined,
    });
    expect(buildScoreGeneratorOptions(ALL)).toHaveProperty("requiredYaku");
  });

  it("点数帯は満貫未満 → 満貫以上の順に並べる", () => {
    expect(
      buildScoreGeneratorOptions({ ...ALL, includeNonMangan: false })
        .allowedRanges,
    ).toEqual(["manganPlus"]);
  });

  it("門前だけなら副露を出さない", () => {
    const options = buildScoreGeneratorOptions({ ...ALL, handShape: "menzen" });
    expect(options.includeFuro).toBe(false);
    expect(options.requireFuro).toBe(false);
  });

  it("副露だけなら副露を必須にする", () => {
    const options = buildScoreGeneratorOptions({ ...ALL, handShape: "furo" });
    expect(options.includeFuro).toBe(true);
    expect(options.requireFuro).toBe(true);
  });

  it("役の指定はそのまま渡す", () => {
    expect(
      buildScoreGeneratorOptions({ ...ALL, requiredYaku: ["平和"] })
        .requiredYaku,
    ).toEqual(["平和"]);
  });
});
