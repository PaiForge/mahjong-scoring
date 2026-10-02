import { describe, expect, it } from "vitest";

import {
  OFFER_KEYS,
  PLANS,
  PLAN_KEYS,
  PlanBenefit,
  PurchaseKind,
  addPassDuration,
  isOfferKey,
  isPlanBenefit,
  isPlanKey,
} from "../plans";

describe("PLANS", () => {
  it("すべてのプランが 1 つ以上の特典を持ち、値は PlanBenefit に収まる", () => {
    for (const key of PLAN_KEYS) {
      const plan = PLANS[key];
      expect(plan.key).toBe(key);
      expect(plan.benefits.length).toBeGreaterThan(0);
      for (const benefit of plan.benefits) {
        expect(isPlanBenefit(benefit)).toBe(true);
      }
    }
  });

  it("すべてのプランが全売り方を持ち、key と kind が整合する", () => {
    for (const key of PLAN_KEYS) {
      const plan = PLANS[key];
      for (const offerKey of OFFER_KEYS) {
        const offer = plan.offers[offerKey];
        expect(offer.key).toBe(offerKey);
        if (offer.kind === PurchaseKind.Pass) {
          expect(offer.durationDays).toBeGreaterThan(0);
        }
      }
      expect(plan.offers.pass.kind).toBe(PurchaseKind.Pass);
      expect(plan.offers.lifetime.kind).toBe(PurchaseKind.Lifetime);
    }
  });

  it("Pro は回数無制限と拡張機能の 2 特典を持つ", () => {
    expect(PLANS.pro.benefits).toEqual([
      PlanBenefit.UnlimitedPractice,
      PlanBenefit.PracticeTools,
    ]);
  });
});

describe("isPlanBenefit / isPlanKey / isOfferKey", () => {
  it("定義済みの値だけを通す", () => {
    expect(isPlanBenefit("unlimited_practice")).toBe(true);
    expect(isPlanBenefit("practice_tools")).toBe(true);
    expect(isPlanBenefit("ad_free")).toBe(false);
    expect(isPlanBenefit("")).toBe(false);

    expect(isPlanKey("pro")).toBe(true);
    expect(isPlanKey("premium")).toBe(false);

    expect(isOfferKey("pass")).toBe(true);
    expect(isOfferKey("lifetime")).toBe(true);
    expect(isOfferKey("monthly")).toBe(false);
  });
});

describe("addPassDuration", () => {
  it("日数ぶん後ろの日時を返す（DST の無い UTC 基準で 24h × 日数）", () => {
    const start = new Date("2026-10-01T00:00:00Z");
    expect(addPassDuration(start, 30).toISOString()).toBe(
      "2026-10-31T00:00:00.000Z",
    );
  });

  it("元の Date を変更しない", () => {
    const start = new Date("2026-10-01T00:00:00Z");
    addPassDuration(start, 30);
    expect(start.toISOString()).toBe("2026-10-01T00:00:00.000Z");
  });
});
