import { describe, expect, it } from "vitest";

import { RANK_REGISTRY } from "../ranks/registry";
import {
  examGoalsFromRegistry,
  parseMobileExamGoalsResponse,
} from "./mobile-api";

describe("examGoalsFromRegistry", () => {
  it("すべての試験の合格ラインをレジストリから組む", () => {
    const { goals } = examGoalsFromRegistry();
    for (const rank of RANK_REGISTRY)
      expect(goals[rank.exam.menuType]).toBe(rank.exam.minScore);
    expect(Object.keys(goals)).toHaveLength(RANK_REGISTRY.length);
  });
});

describe("parseMobileExamGoalsResponse", () => {
  it("合格ラインを読む", () => {
    expect(
      parseMobileExamGoalsResponse({ goals: { fu_score_exam: 5 } }),
    ).toEqual({ goals: { fu_score_exam: 5 } });
  });

  it("形が違う値の試験だけを落とす", () => {
    expect(
      parseMobileExamGoalsResponse({
        goals: {
          fu_score_exam: 5,
          score_exam: "4",
          fu_exam: 0,
          pinfu_exam: 1.5,
        },
      }),
    ).toEqual({ goals: { fu_score_exam: 5 } });
  });

  it("goals が無ければ undefined", () => {
    expect(parseMobileExamGoalsResponse({})).toBeUndefined();
    expect(parseMobileExamGoalsResponse(undefined)).toBeUndefined();
  });
});
