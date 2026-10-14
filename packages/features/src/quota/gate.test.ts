// @vitest-environment node
import { describe, expect, it } from "vitest";

import { PlanBenefit } from "../billing/plans";

import { type PracticeQuotaGate, showsAnswerTime } from "./gate";

const openWith = (benefits: readonly PlanBenefit[]): PracticeQuotaGate => ({
  kind: "open",
  remaining: "unlimited",
  limit: "unlimited",
  benefits,
});

describe("showsAnswerTime", () => {
  it("設定がオンで特典に PracticeTools があれば出す", () => {
    expect(showsAnswerTime(true, openWith([PlanBenefit.PracticeTools]))).toBe(
      true,
    );
  });

  it("設定がオフなら特典があっても出さない", () => {
    expect(showsAnswerTime(false, openWith([PlanBenefit.PracticeTools]))).toBe(
      false,
    );
  });

  it("特典に PracticeTools が無ければ出さない", () => {
    expect(
      showsAnswerTime(true, openWith([PlanBenefit.UnlimitedPractice])),
    ).toBe(false);
  });

  it("出題許可が open でなければ出さない", () => {
    expect(showsAnswerTime(true, undefined)).toBe(false);
    expect(showsAnswerTime(true, { kind: "unverified" })).toBe(false);
    expect(
      showsAnswerTime(true, {
        kind: "blocked",
        limit: 3,
        signedIn: true,
        benefits: [PlanBenefit.PracticeTools],
      }),
    ).toBe(false);
  });
});
