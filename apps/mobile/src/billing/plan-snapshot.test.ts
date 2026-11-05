import { describe, expect, it } from "vitest";
import type { MobilePlanResponse } from "@mahjong-scoring/features/billing/mobile-api";

import { planToShowOf } from "./plan-snapshot";

const PLAN: MobilePlanResponse = {
  status: { kind: "lifetime" },
  benefits: [],
  canPurchase: false,
  offers: [],
  purchases: [],
};

describe("planToShowOf", () => {
  it("同じユーザーのスナップショットはそのまま出す", () => {
    expect(planToShowOf({ userId: "user-a", plan: PLAN }, "user-a")).toBe(PLAN);
  });

  it("別のユーザーのスナップショットは出さず、読み直す", () => {
    expect(
      planToShowOf({ userId: "user-a", plan: PLAN }, "user-b"),
    ).toBeUndefined();
  });

  it("スナップショットの無い合図は読み直す", () => {
    expect(planToShowOf(undefined, "user-a")).toBeUndefined();
  });
});
