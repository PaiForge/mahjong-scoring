import { describe, expect, it } from "vitest";
import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";
import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";

import { resolvePracticeToolsAccess } from "./practice-tools-access";

function plan(benefits: readonly PlanBenefit[]): MobilePlanResponse {
  return {
    status: { kind: "free" },
    benefits,
    canPurchase: true,
    offers: [],
    purchases: [],
  } as unknown as MobilePlanResponse;
}

describe("resolvePracticeToolsAccess", () => {
  it("読み込み中は押せないスイッチ", () => {
    expect(resolvePracticeToolsAccess({ kind: "loading" })).toBe("pending");
  });

  it("practice_tools があればスイッチ（読み直しの間も前の値で決める）", () => {
    const value = plan([PlanBenefit.PracticeTools]);
    expect(
      resolvePracticeToolsAccess({ kind: "loaded", value, pending: false }),
    ).toBe("granted");
    expect(
      resolvePracticeToolsAccess({ kind: "loaded", value, pending: true }),
    ).toBe("granted");
  });

  it("特典なし・読めなかったときは鍵の行", () => {
    expect(
      resolvePracticeToolsAccess({
        kind: "loaded",
        value: plan([PlanBenefit.UnlimitedPractice]),
        pending: false,
      }),
    ).toBe("locked");
    expect(resolvePracticeToolsAccess({ kind: "failed", error: "x" })).toBe(
      "locked",
    );
  });
});
