import {
  DEFAULT_RULE_SETTINGS,
  toYakumanRuleConfig,
} from "@mahjong-scoring/core";
import { describe, expect, it } from "vitest";

import { ruleBoundaryExclusions } from "../../challenge/rule-boundary";

import {
  manganScoreCalculationGenerateOptions,
  scoreCalculationGenerateOptions,
} from "./generate-options";

const yakumanRules = toYakumanRuleConfig(DEFAULT_RULE_SETTINGS);

describe("scoreCalculationGenerateOptions", () => {
  it("端末のルール設定をそのまま渡し、チャレンジでは境界の手を落とす", () => {
    expect(
      scoreCalculationGenerateOptions(
        { renfonpaiAs4Fu: true, kiriageMangan: false, yakumanRules },
        false,
      ),
    ).toEqual({
      renfonpaiAs4Fu: true,
      kiriageMangan: false,
      yakumanRules,
      ...ruleBoundaryExclusions(false),
    });
  });

  it("トレーニングでは境界の手も出す", () => {
    const options = scoreCalculationGenerateOptions(
      { renfonpaiAs4Fu: false, kiriageMangan: true, yakumanRules },
      true,
    );
    expect(options.excludeKiriageBoundary).toBe(false);
    expect(options.excludeYakumanRuleBoundary).toBe(false);
  });
});

describe("manganScoreCalculationGenerateOptions", () => {
  it("満貫以上に絞り、役満の形と境界除外だけを持つ", () => {
    expect(manganScoreCalculationGenerateOptions(yakumanRules, false)).toEqual({
      allowedRanges: ["manganPlus"],
      yakumanRules,
      ...ruleBoundaryExclusions(false),
    });
  });
});
