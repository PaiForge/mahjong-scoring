// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DAILY_PROBLEM_RULE_VARIANTS,
  isDailyProblemEligible,
} from "./eligibility";
import {
  eligibleAgariPayload,
  kiriageBoundaryAgariPayload,
  otherEligibleAgariPayload,
  renfonpaiAgariPayload,
  yakumanAgariPayload,
} from "./test-payloads";

describe("isDailyProblemEligible", () => {
  it("連風牌の符（2 / 4）× 切り上げ満貫（無 / 有）の 4 通りのルールで確かめる", () => {
    expect(
      DAILY_PROBLEM_RULE_VARIANTS.map(({ renfonpaiAs4Fu, kiriageMangan }) => [
        renfonpaiAs4Fu,
        kiriageMangan,
      ]),
    ).toEqual([
      [false, false],
      [false, true],
      [true, false],
      [true, true],
    ]);
  });

  it("どのルール設定で組み立てても正解が同じで役満でない手は出せる", () => {
    expect(isDailyProblemEligible(eligibleAgariPayload())).toBe(true);
    expect(isDailyProblemEligible(otherEligibleAgariPayload())).toBe(true);
  });

  it("切り上げ満貫の有無で点数が割れる手（30 符 4 翻）は出さない", () => {
    expect(isDailyProblemEligible(kiriageBoundaryAgariPayload())).toBe(false);
  });

  it("連風牌の雀頭の符（2 / 4）で正解が割れる手は出さない", () => {
    expect(isDailyProblemEligible(renfonpaiAgariPayload())).toBe(false);
  });

  it("役満の手はルールで割れなくても出さない（日課の 1 問として極端）", () => {
    expect(isDailyProblemEligible(yakumanAgariPayload())).toBe(false);
  });

  it("組み立て直せない盤面（和了牌が手牌に無い）は出さない", () => {
    expect(
      isDailyProblemEligible({ ...eligibleAgariPayload(), agariHai: 33 }),
    ).toBe(false);
  });
});
